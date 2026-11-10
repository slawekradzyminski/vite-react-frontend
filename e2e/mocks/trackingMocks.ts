import type { Page } from '@playwright/test';
import { fulfillWithWarehouseSchema, type WarehouseSchema } from './warehouseContract';

export type PublicTracking = WarehouseSchema<'PublicTrackingDto'>;
export type OrderTracking = WarehouseSchema<'TrackingDto'>;
export type Shipment = WarehouseSchema<'ShipmentDto'>;

export const trackingMocks = {
  async mockPublicTracking(page: Page, tracking: PublicTracking) {
    await page.route(`**/api/v1/tracking/${tracking.trackingNumber}`, async (route) => {
      await fulfillWithWarehouseSchema(route, 'PublicTrackingDto', tracking);
    });
  },

  async mockUnknownTrackingNumber(page: Page, trackingNumber: string) {
    await page.route(`**/api/v1/tracking/${trackingNumber}`, async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Tracking number not found' }) });
    });
  },

  /** The shipment and its carrier timeline for an order; returns how often the timeline was read. */
  async mockOrderShipment(page: Page, shipment: Shipment & { orderId: number }, tracking: OrderTracking) {
    const reads = { count: 0 };
    await page.route(`**/api/v1/orders/${shipment.orderId}/shipment`, async (route) => {
      await fulfillWithWarehouseSchema(route, 'ShipmentDto', shipment);
    });
    await page.route(`**/api/v1/orders/${shipment.orderId}/shipment/tracking`, async (route) => {
      reads.count += 1;
      await fulfillWithWarehouseSchema(route, 'TrackingDto', tracking);
    });
    return reads;
  },
};
