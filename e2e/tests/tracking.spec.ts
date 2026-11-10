import { test as anonymousTest, expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { TrackingPage } from '../pages/tracking.page.object';
import { trackingMocks, type OrderTracking } from '../mocks/trackingMocks';
import { orderMocks, type OrderState } from '../mocks/orderMocks';

const EVENTS: OrderTracking['events'] = [
  { status: 'LABEL_CREATED', location: 'Warehouse, Warsaw', description: 'Shipping label created', occurredAt: '2026-11-09T09:00:00' },
  { status: 'IN_TRANSIT', location: 'DHL Hub, Leipzig', description: 'Collected from the sender and sorted at the hub', occurredAt: '2026-11-09T15:00:00' },
  { status: 'OUT_FOR_DELIVERY', location: 'Berlin', description: 'Out for delivery', occurredAt: '2026-11-10T08:00:00' },
  { status: 'DELIVERY_FAILED', location: 'Berlin', description: 'Nobody was home', occurredAt: '2026-11-10T12:00:00' },
];

anonymousTest.describe('Public parcel tracking', () => {
  anonymousTest('finds a parcel by tracking number without logging in', async ({ page }) => {
    // given
    await trackingMocks.mockPublicTracking(page, {
      carrier: 'DHL', trackingNumber: '1234567890', currentStatus: 'DELIVERY_FAILED', simulated: true,
      estimatedDelivery: '2026-11-11T12:00:00', events: EVENTS,
    });
    const trackingPage = new TrackingPage(page);
    await trackingPage.goto();

    // when
    await trackingPage.track(' 12345 67890 ');

    // then
    await expect(page).toHaveURL(/\/track\/1234567890$/);
    await expect(trackingPage.currentStatus).toHaveText('Delivery attempt failed');
    await expect(trackingPage.carrier).toHaveText('DHL');
    await expect(trackingPage.trackingNumber).toHaveText('1234567890');
    await expect(trackingPage.estimatedDelivery).toContainText('Estimated delivery');
    await expect(trackingPage.events).toHaveCount(4);
    await expect(trackingPage.events.first()).toHaveAttribute('data-status', 'DELIVERY_FAILED');
    await expect(page).not.toHaveURL(/\/login/);
  });

  anonymousTest('says when a deep-linked number is unknown and validates input', async ({ page }) => {
    // given
    await trackingMocks.mockUnknownTrackingNumber(page, '0000000000');
    const trackingPage = new TrackingPage(page);

    // when
    await trackingPage.goto('0000000000');

    // then
    await expect(trackingPage.notFound).toContainText('No parcel with tracking number 0000000000 was found');

    // when
    await trackingPage.track('ABC-1');

    // then
    await expect(trackingPage.inputError).toHaveText('Use letters and digits only');
  });
});

test.describe('Order tracking timeline', () => {
  test('shows carrier scans for a shipped order', async ({ authenticatedPage }) => {
    // given
    const { page, user } = authenticatedPage;
    const order = {
      id: 77, username: user.username, status: 'SHIPPED', fulfilmentState: 'SHIPPED', totalAmount: 99.99,
      netAmount: 81.29, taxAmount: 18.7, taxRate: 23, taxCountry: 'PL',
      createdAt: '2026-11-09T08:00:00Z', updatedAt: '2026-11-09T08:00:00Z',
      items: [{ id: 1, productId: 1, productName: 'Desk Lamp', quantity: 1, unitPrice: 99.99, totalPrice: 99.99 }],
      shippingAddress: { street: 'Main 1', city: 'Warsaw', state: 'MZ', zipCode: '00-001', country: 'Poland' },
    } satisfies OrderState;
    await orderMocks.mockOrderWithState(page, order);
    await trackingMocks.mockOrderShipment(
      page,
      { id: 5, orderId: 77, status: 'SHIPPED', carrier: 'DHL', trackingNumber: '1234567890' },
      { shipmentId: 5, orderId: 77, carrier: 'DHL', trackingNumber: '1234567890', simulated: true, currentStatus: 'DELIVERY_FAILED', estimatedDelivery: '2026-11-11T12:00:00', events: EVENTS },
    );

    // when
    await page.goto('/orders/77');

    // then
    await expect(page.getByTestId('order-details-vat')).toHaveText('Includes VAT 23% (PL): $18.70, net: $81.29');
    const timeline = page.getByTestId('order-tracking');
    await expect(timeline.getByTestId('tracking-current-status')).toHaveText('Delivery attempt failed');
    await expect(timeline.getByTestId('tracking-events').getByRole('listitem')).toHaveCount(4);
    await expect(timeline.getByTestId('tracking-event-1').getByTestId('tracking-event-location')).toContainText('DHL Hub, Leipzig');
    await expect(timeline.getByTestId('order-tracking-public-link')).toHaveAttribute('href', '/track/1234567890');
  });
});
