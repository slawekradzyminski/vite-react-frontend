import type { APIRequestContext } from '@playwright/test';
import { test, expect } from '../fixtures/auth.fixture';
import { BACKEND_URL } from '../config/constants';
import { createAdminUser } from '../utils/auth.utils';
import type { BackendSchema } from '../mocks/backendContract';

const bearer = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

// A real PENDING order: one unit of an in-stock product, placed through the REST API.
async function placeOrder(request: APIRequestContext, token: string): Promise<BackendSchema<'OrderDto'>> {
  const products = (await (await request.get(`${BACKEND_URL}/api/v1/products`, bearer(token))).json()) as BackendSchema<'ProductDto'>[];
  const product = products.find((candidate) => (candidate.stockQuantity ?? 0) > 5);
  expect(product, 'an in-stock product').toBeDefined();
  const added = await request.post(`${BACKEND_URL}/api/v1/cart/items`, { ...bearer(token), data: { productId: product?.id, quantity: 1 } });
  expect(added.status()).toBe(200);
  const created = await request.post(`${BACKEND_URL}/api/v1/orders`, {
    ...bearer(token),
    data: { street: 'Main 1', city: 'Warsaw', state: 'Mazovia', zipCode: '00-001', country: 'Poland' },
  });
  expect(created.status()).toBe(201);
  return created.json();
}

test.describe('Distributed lab against the running services', () => {
  test('a new order is reserved, and the admin time control expires it', async ({ authenticatedPage }) => {
    // given
    const { page, token } = authenticatedPage;
    const order = await placeOrder(page.request, token);
    expect(order.status).toBe('PENDING');
    expect(order.reservationExpiresAt).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);

    // when
    await page.goto(`/orders/${order.id}`);

    // then
    await expect(page.getByTestId('reservation-countdown')).toContainText(/Reserved until \d\d:\d\d/);
    await expect(page.getByTestId('reservation-countdown-remaining')).toHaveText(/^\d+:\d\d left to pay$/);
    // warehouse-service answers the parcels list through the gateway; nothing is released yet.
    const parcels = await page.request.get(`${BACKEND_URL}/api/v1/orders/${order.id}/shipments`, bearer(token));
    expect(parcels.status()).toBe(200);
    expect(await parcels.json()).toEqual([]);

    // when
    const admin = await createAdminUser(page.request);
    const expired = await page.request.post(`${BACKEND_URL}/api/v1/admin/orders/${order.id}/expire-reservation`, bearer(admin.token));
    expect(expired.status()).toBe(200);
    await page.reload();

    // then
    await expect(page.getByTestId('order-details-status')).toHaveText('CANCELLED');
    await expect(page.getByTestId('reservation-expired')).toBeVisible();
    const again = await page.request.post(`${BACKEND_URL}/api/v1/admin/orders/${order.id}/expire-reservation`, bearer(admin.token));
    expect(again.status()).toBe(409);
  });

  test('webhooks and notifications are served by notification-service', async ({ authenticatedPage }) => {
    // given
    const { page } = authenticatedPage;

    // when
    await page.goto('/account/webhooks');

    // then - the event types come from the API, including the new reservation event
    await expect(page.getByTestId('webhook-create-event-order.reservation-expired')).toBeVisible();

    // when
    await page.goto('/account/notifications');

    // then - a fresh account has no commerce emails yet
    await expect(page.getByTestId('notifications-empty')).toBeVisible();
  });
});
