import { test as anonymousTest, expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { TrackingPage } from '../pages/tracking.page.object';
import { trackingMocks, type PublicTracking } from '../mocks/trackingMocks';
import { orderMocks, type OrderState } from '../mocks/orderMocks';

const EVENTS: PublicTracking['events'] = [
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

test.describe('Split shipment tracking', () => {
  test('shows each parcel with its location, lines and its own carrier timeline', async ({ authenticatedPage }) => {
    // given
    const { page, user } = authenticatedPage;
    const order = {
      id: 77, username: user.username, status: 'SHIPPED', fulfilmentState: 'PACKED', totalAmount: 129.98,
      netAmount: 105.68, taxAmount: 24.3, taxRate: 23, taxCountry: 'PL',
      createdAt: '2026-11-09T08:00:00Z', updatedAt: '2026-11-09T08:00:00Z',
      items: [
        { id: 1, productId: 1, productName: 'Desk Lamp', quantity: 1, unitPrice: 99.99, totalPrice: 99.99 },
        { id: 2, productId: 2, productName: 'Paperback', quantity: 1, unitPrice: 29.99, totalPrice: 29.99 },
      ],
      shippingAddress: { street: 'Main 1', city: 'Warsaw', state: 'MZ', zipCode: '00-001', country: 'Poland' },
    } satisfies OrderState;
    await orderMocks.mockOrderWithState(page, order);
    const reads = await trackingMocks.mockOrderParcels(
      page,
      77,
      [
        {
          id: 5, orderId: 77, status: 'SHIPPED', carrier: 'DHL', trackingNumber: '1234567890',
          locationCode: 'KRK', locationName: 'Krakow Central', parcelIndex: 1, parcelCount: 2,
          lines: [{ productId: 1, productName: 'Desk Lamp', category: 'Home', quantity: 1 }],
        },
        {
          id: 6, orderId: 77, status: 'PACKED', locationCode: 'GDN', locationName: 'Gdansk North', parcelIndex: 2, parcelCount: 2,
          lines: [{ productId: 2, productName: 'Paperback', category: 'Books', quantity: 1 }],
        },
      ],
      [{ carrier: 'DHL', trackingNumber: '1234567890', simulated: true, currentStatus: 'DELIVERY_FAILED', estimatedDelivery: '2026-11-11T12:00:00', events: EVENTS }],
    );

    // when
    await page.goto('/orders/77');

    // then
    await expect(page.getByTestId('order-details-vat')).toHaveText('Includes VAT 23% (PL): $24.30, net: $105.68');
    await expect(page.getByTestId('order-parcel-count')).toContainText('2 parcels');
    const first = page.getByTestId('parcel-1');
    const second = page.getByTestId('parcel-2');
    await expect(first.getByTestId('parcel-1-location')).toHaveText('Ships from Krakow Central (KRK)');
    await expect(first.getByTestId('parcel-1-line-1')).toContainText('Desk Lamp');
    await expect(second.getByTestId('parcel-2-location')).toHaveText('Ships from Gdansk North (GDN)');
    await expect(second.getByTestId('parcel-2-line-2')).toContainText('Paperback');
    await expect(second.getByTestId('parcel-2-status')).toHaveText('PACKED');
    const timeline = first.getByTestId('parcel-1-tracking');
    await expect(timeline.getByTestId('tracking-current-status')).toHaveText('Delivery attempt failed');
    await expect(timeline.getByTestId('tracking-events').getByRole('listitem')).toHaveCount(4);
    await expect(timeline.getByTestId('tracking-event-1').getByTestId('tracking-event-location')).toContainText('DHL Hub, Leipzig');
    await expect(timeline.getByTestId('parcel-1-tracking-public-link')).toHaveAttribute('href', '/track/1234567890');
    await expect(second.getByTestId('parcel-2-tracking')).toHaveCount(0);
    expect(reads['1234567890']).toBeGreaterThan(0);
  });
});
