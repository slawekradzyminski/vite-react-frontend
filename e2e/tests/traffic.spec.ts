import { BACKEND_URL } from '../config/constants';
import { test, expect } from '../fixtures/auth.fixture';
import { TrafficPage } from '../pages/traffic.page.object';
import type { Page } from '@playwright/test';

test.describe('Traffic Monitor Page', () => {
  let trafficPage: TrafficPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    trafficPage = new TrafficPage(authenticatedPage.page);
    await trafficPage.goto();
  });


  test('should connect to WebSocket and show connected status', async () => {
    // when
    await trafficPage.waitForConnection();
    
    // then
    await expect(trafficPage.statusPill).toContainText('Connected');
    await expect(trafficPage.statusMessage).toContainText('Connected to traffic monitor');
  });

  test('should display traffic events when API requests are made', async ({ authenticatedPage, request }) => {
    // given
    const { page, token } = authenticatedPage;
    
    // when
    await trafficPage.waitForConnection();
    const clientSessionId = await getClientSessionId(page);
    await request.get(`${BACKEND_URL}/api/v1/products`, authHeaders(token, clientSessionId));
    await request.get(`${BACKEND_URL}/api/v1/products/1`, authHeaders(token, clientSessionId));
    await page.waitForTimeout(1000);

    // then
    await expect(trafficPage.trafficEventsTable).toBeVisible();
    const methodElement1 = page.locator('td:has-text("/api/v1/products")').first();
    await expect(methodElement1).toBeVisible();
    const methodElement2 = page.locator('td:has-text("/api/v1/products/1")').first();
    await expect(methodElement2).toBeVisible();
    const statusElement1 = page.locator('td:has-text("200")').first();
    await expect(statusElement1).toBeVisible();
  });

  test('shows GraphQL partial errors as failures even with HTTP 200', async ({ clientPage, request }) => {
    // given
    const { page, token } = clientPage;
    const protocolTrafficPage = new TrafficPage(page);
    await protocolTrafficPage.goto();
    await protocolTrafficPage.waitForConnection();
    const clientSessionId = await page.getByRole('textbox', { name: 'Traffic session ID' }).inputValue();

    // when
    const response = await request.post(`${BACKEND_URL}/api/v1/graphql`, {
      ...authHeaders(token, clientSessionId),
      data: { query: '{ products(limit:1){items{id}} cart(username:"another-customer"){totalItems} }' },
    });
    const correlationId = response.headers()['x-correlation-id'];

    // then
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.errors[0].extensions.code).toBe('FORBIDDEN');
    const row = page.getByRole('row').filter({ hasText: correlationId });
    await expect(row).toContainText('GraphQL');
    await expect(row).toContainText('query cart,products');
    await expect(row).toContainText('Partial error · HTTP 200');
    await expect(row.locator('[data-testid^="traffic-event-status-"] span')).toHaveClass(/text-red-600/);
    await expect(row).not.toContainText('another-customer');
  });

  // given
  test('should clear events when clicking clear button', async ({ authenticatedPage, request }) => {
    // given
    const { page, token } = authenticatedPage;

    await trafficPage.waitForConnection();
    const clientSessionId = await getClientSessionId(page);
    await request.get(`${BACKEND_URL}/api/v1/products`, authHeaders(token, clientSessionId));
    await request.get(`${BACKEND_URL}/api/v1/products/1`, authHeaders(token, clientSessionId));
    await page.waitForTimeout(1000);
    const methodElement1 = page.locator('td:has-text("/api/v1/products")').first();
    await expect(methodElement1).toBeVisible();
    
    // when
    await trafficPage.clearEvents();
    
    // then
    await expect(trafficPage.noEventsMessage).toBeVisible();
  });
}); 

const getClientSessionId = async (page: Page) => {
  const clientSessionId = await page.evaluate(() => localStorage.getItem('clientSessionId'));
  expect(clientSessionId).toBeTruthy();
  return clientSessionId!;
};

const authHeaders = (token: string, clientSessionId: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        'X-Client-Session-Id': clientSessionId,
    },
});
