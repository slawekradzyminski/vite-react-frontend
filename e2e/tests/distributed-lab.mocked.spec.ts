import { test, expect } from '../fixtures/mocked-session.fixture';
import { fulfillWithSchema } from '../mocks/backendContract';
import { fulfillWithNotificationSchema, type NotificationSchema } from '../mocks/notificationContract';
import { fulfillWithWarehouseSchema, type WarehouseSchema } from '../mocks/warehouseContract';
import { orderMocks } from '../mocks/orderMocks';
import { PaymentServiceMock, pendingOrder } from '../mocks/paymentMocks';

type Location = WarehouseSchema<'WarehouseLocationDto'>;
type Shipment = WarehouseSchema<'ShipmentDto'>;

const secondsFromNow = (seconds: number) => new Date(Date.now() + seconds * 1000).toISOString();

test.describe('Stock reservations (mocked services)', () => {
  test('counts down on the order and shows the expiry once the backend cancelled it', async ({ mockedClient }) => {
    // given - the reservation ends in three seconds; the backend cancels the order at its second read
    const { page, username } = mockedClient;
    const expiresAt = secondsFromNow(3);
    const order = pendingOrder(61, username, { reservationExpiresAt: expiresAt });
    await orderMocks.mockOrderWithState(page, order);
    let reads = 0;
    await page.route('**/api/v1/orders/61', async (route) => {
      reads += 1;
      const expired = reads > 1 && Date.now() >= Date.parse(expiresAt);
      await fulfillWithSchema(route, 'OrderDto', expired ? { ...order, status: 'CANCELLED', updatedAt: new Date().toISOString() } : order);
    });

    // when
    await page.goto('/orders/61');

    // then
    await expect(page.getByTestId('reservation-countdown')).toContainText(/Reserved until \d\d:\d\d/);
    await expect(page.getByTestId('reservation-countdown-remaining')).toHaveText(/0:0[0-3] left to pay|Reservation ending…/);
    await expect(page.getByTestId('reservation-expired')).toBeVisible({ timeout: 12_000 });
    await expect(page.getByTestId('reservation-countdown')).toHaveCount(0);
    await expect(page.getByTestId('order-details-status')).toHaveText('CANCELLED');
  });

  test('shows the countdown on the payment page and the expiry when payment-service refuses the order', async ({ mockedClient }) => {
    // given
    const { page, username } = mockedClient;
    const order = pendingOrder(62, username, { reservationExpiresAt: secondsFromNow(600) });
    const paymentService = new PaymentServiceMock(order);
    await paymentService.install(page);
    await page.route('**/api/v1/payments', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      // The reservation ran out between loading the page and paying.
      order.status = 'CANCELLED';
      order.reservationExpiresAt = new Date(Date.now() - 1000).toISOString();
      order.updatedAt = new Date().toISOString();
      await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ message: 'Order reservation expired' }) });
    });

    // when
    await page.goto('/orders/62/pay');

    // then
    await expect(page.getByTestId('reservation-countdown')).toContainText(/Reserved until \d\d:\d\d/);
    await expect(page.getByTestId('reservation-countdown-remaining')).toHaveText(/^(10:00|9:\d\d) left to pay$/);

    // when
    await page.getByTestId('payment-card-number-input').fill('4242 4242 4242 4242');
    await page.getByTestId('payment-card-expiry-input').fill('12/30');
    await page.getByTestId('payment-card-cvc-input').fill('123');
    await page.getByTestId('payment-card-holder-input').fill('Mocked Client');
    await page.getByTestId('payment-submit').click();

    // then
    await expect(page.getByTestId('payment-not-payable-message')).toContainText('Order reservation expired');
    await expect(page.getByTestId('reservation-expired')).toBeVisible();
  });

  test('lets an administrator expire a reservation now', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    const order = pendingOrder(63, 'client', { reservationExpiresAt: secondsFromNow(1800) });
    await orderMocks.mockOrderWithState(page, order);
    const calls: string[] = [];
    await page.route('**/api/v1/admin/orders/63/expire-reservation', async (route) => {
      calls.push(route.request().method());
      const now = new Date().toISOString();
      Object.assign(order, { status: 'CANCELLED', reservationExpiresAt: now, updatedAt: now });
      await fulfillWithSchema(route, 'OrderDto', order);
    });

    // when
    await page.goto('/orders/63');
    await expect(page.getByTestId('reservation-countdown')).toBeVisible();
    await page.getByTestId('order-details-expire-reservation').click();

    // then
    expect(calls).toEqual(['POST']);
    await expect(page.getByTestId('reservation-expired')).toBeVisible();
    await expect(page.getByTestId('order-details-status')).toHaveText('CANCELLED');
    await expect(page.getByTestId('order-details-expire-reservation')).toHaveCount(0);
  });
});

test.describe('My notifications (mocked notification-service)', () => {
  test('lists the commerce emails the shop sent', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    const emails: NotificationSchema<'NotificationEmailDto'>[] = [
      {
        id: '0b8f4f0e-3f43-4b8e-9d55-4a3f1c1f6a10', template: 'PAYMENT_RECEIVED', subject: 'Payment received for order #42',
        status: 'SENT', recipientMasked: 'm***@example.com', attempts: 1,
        createdAt: '2026-11-10T20:40:33Z', updatedAt: '2026-11-10T20:40:34Z', sentAt: '2026-11-10T20:40:34Z', failureReason: null,
      },
      {
        id: '1c9e5a1f-4b54-4c9f-8e66-5b4a2d2a7b21', template: 'ORDER_SHIPPED', subject: 'Order #42 is on its way',
        status: 'QUEUED', recipientMasked: 'm***@example.com', attempts: 0,
        createdAt: '2026-11-11T08:00:00Z', updatedAt: '2026-11-11T08:00:00Z', sentAt: null, failureReason: null,
      },
    ];
    const requested: string[] = [];
    await page.route(/\/api\/v1\/notifications\/emails(\?.*)?$/, async (route) => {
      requested.push(new URL(route.request().url()).search);
      await fulfillWithNotificationSchema(route, 'PageDtoNotificationEmailDto', {
        content: emails, pageNumber: 0, pageSize: 10, totalElements: emails.length, totalPages: 1,
      });
    });

    // when
    await page.goto('/account/notifications');

    // then
    await expect(page.getByRole('heading', { name: 'My notifications' })).toBeVisible();
    await expect(page.getByTestId('notifications-list').getByRole('listitem')).toHaveCount(2);
    await expect(page.getByTestId(`notification-subject-${emails[0].id}`)).toHaveText('Payment received for order #42');
    await expect(page.getByTestId(`notification-template-${emails[1].id}`)).toHaveText('Order shipped');
    await expect(page.getByTestId(`notification-status-${emails[1].id}`)).toHaveText('QUEUED');
    await expect(page.getByTestId(`notification-meta-${emails[0].id}`)).toContainText('To m***@example.com');
    expect(requested[0]).toBe('?page=0&size=10');
  });
});

test.describe('Warehouse locations (mocked warehouse-service)', () => {
  test('deactivates a location and shows the reconciliation report', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    const locations: Location[] = [
      { code: 'KRK', name: 'Krakow Central', city: 'Krakow', active: true, priority: 1, primaryCategories: ['*'], backupCategories: [] },
      { code: 'GDN', name: 'Gdansk North', city: 'Gdansk', active: true, priority: 2, primaryCategories: ['Books'], backupCategories: ['*'] },
    ];
    const updates: unknown[] = [];
    await page.route('**/api/v1/warehouse/locations', (route) => fulfillWithWarehouseSchema(route, 'WarehouseLocationDto', locations));
    await page.route('**/api/v1/warehouse/locations/*', async (route) => {
      const body = route.request().postDataJSON() as { active: boolean };
      updates.push(body);
      const code = route.request().url().split('/').pop();
      const location = locations.find((entry) => entry.code === code) as Location;
      location.active = body.active;
      await fulfillWithWarehouseSchema(route, 'WarehouseLocationDto', location);
    });
    await page.route('**/api/v1/warehouse/reconciliation', (route) => fulfillWithWarehouseSchema(route, 'ReconciliationDto', [{
      orderId: 42, backendState: 'AWAITING_PICK', aggregateState: 'PICKED', lastMirroredState: 'AWAITING_PICK',
      parcels: [{ shipmentId: 7, locationCode: 'KRK', status: 'PICKED' }, { shipmentId: 8, locationCode: 'GDN', status: 'PICKED' }],
    }]));

    // when
    await page.goto('/warehouse/locations');
    await page.getByTestId('warehouse-location-toggle-GDN').click();

    // then
    expect(updates).toEqual([{ active: false }]);
    await expect(page.getByTestId('warehouse-location-status-GDN')).toHaveText('INACTIVE');
    await expect(page.getByTestId('warehouse-location-toggle-GDN')).toHaveText('Activate');
    await expect(page.getByTestId('warehouse-location-status-KRK')).toHaveText('ACTIVE');
    await expect(page.getByTestId('warehouse-reconciliation-expected-42')).toHaveText('PICKED');
    await expect(page.getByTestId('warehouse-reconciliation-parcels-42')).toHaveText('#7 KRK PICKED, #8 GDN PICKED');
  });

  test('shows parcel locations on the board and reallocates an awaiting parcel', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    const parcel = (overrides: Partial<Shipment>): Shipment => ({
      id: 7, orderId: 42, username: 'client', status: 'AWAITING_PICK', totalUnits: 1, lastActor: 'admin',
      locationCode: 'KRK', locationName: 'Krakow Central', parcelIndex: 1, parcelCount: 2,
      lines: [{ productId: 3, productName: 'Desk lamp', category: 'Home', quantity: 1 }],
      ...overrides,
    });
    let shipments: Shipment[] = [parcel({}), parcel({ id: 8, locationCode: 'GDN', locationName: 'Gdansk North', parcelIndex: 2, lines: [{ productId: 4, productName: 'Paperback', category: 'Books', quantity: 1 }] })];
    const reallocations: unknown[] = [];
    await page.route(/\/api\/v1\/warehouse\/queue(\?.*)?$/, (route) => fulfillWithSchema(route, 'PageDtoOrderDto', { content: [], pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0 }));
    await page.route(/\/api\/v1\/warehouse\/shipments(\?.*)?$/, (route) => fulfillWithWarehouseSchema(route, 'PageDtoShipmentDto', {
      content: shipments, pageNumber: 0, pageSize: 50, totalElements: shipments.length, totalPages: 1,
    }));
    await page.route(/\/api\/v1\/warehouse\/shipments\/\d+\/pick-list$/, (route) => fulfillWithWarehouseSchema(route, 'PickListDto', {
      shipmentId: 7, orderId: 42, status: 'AWAITING_PICK', totalUnits: 1, items: [{ productId: 3, productName: 'Desk lamp', category: 'Home', quantity: 1 }],
    }));
    await page.route('**/api/v1/warehouse/locations', (route) => fulfillWithWarehouseSchema(route, 'WarehouseLocationDto', [
      { code: 'KRK', name: 'Krakow Central', city: 'Krakow', active: true, priority: 1, primaryCategories: ['*'], backupCategories: [] },
      { code: 'GDN', name: 'Gdansk North', city: 'Gdansk', active: true, priority: 2, primaryCategories: ['Books'], backupCategories: ['*'] },
    ]));
    await page.route('**/api/v1/warehouse/shipments/7/reallocate', async (route) => {
      reallocations.push(route.request().postDataJSON());
      const merged = parcel({ id: 8, locationCode: 'GDN', locationName: 'Gdansk North', parcelIndex: 1, parcelCount: 1, totalUnits: 2 });
      shipments = [merged];
      await fulfillWithWarehouseSchema(route, 'ShipmentDto', merged);
    });

    // when
    await page.goto('/warehouse');

    // then
    await expect(page.getByTestId('warehouse-shipment-location-7')).toHaveText('KRK · parcel 1/2');
    await expect(page.getByTestId('warehouse-shipment-location-8')).toHaveText('GDN · parcel 2/2');

    // when
    await page.getByTestId('warehouse-shipment-7').click();
    await expect(page.getByTestId('warehouse-selected-location')).toHaveText('Ships from Krakow Central (KRK) · parcel 1 of 2');
    await page.getByTestId('warehouse-reallocate-target-7').selectOption('GDN');
    await page.getByTestId('warehouse-reallocate-7').click();

    // then
    await expect(page.getByTestId('warehouse-notice')).toHaveText('Parcel lines now ship from Gdansk North (GDN) in shipment #8');
    expect(reallocations).toEqual([{ targetLocation: 'GDN' }]);
    await expect(page.getByTestId('warehouse-shipment-location-8')).toHaveText('GDN');
    await expect(page.getByTestId('warehouse-shipment-7')).toHaveCount(0);
  });
});
