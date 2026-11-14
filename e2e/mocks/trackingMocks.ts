import type { Page } from '@playwright/test';
import { fulfillWithWarehouseSchema, type WarehouseSchema } from './warehouseContract';

export type PublicTracking = WarehouseSchema<'PublicTrackingDto'>;
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

  /**
   * The parcels of an order and the carrier timeline of each shipped one (by tracking number);
   * returns how often each timeline was read.
   */
  async mockOrderParcels(page: Page, orderId: number, parcels: Shipment[], trackings: PublicTracking[] = []) {
    const reads: Record<string, number> = {};
    await page.route(`**/api/v1/orders/${orderId}/shipments`, async (route) => {
      await fulfillWithWarehouseSchema(route, 'ShipmentDto', parcels);
    });
    for (const tracking of trackings) {
      const number = tracking.trackingNumber as string;
      reads[number] = 0;
      await page.route(`**/api/v1/tracking/${number}`, async (route) => {
        reads[number] += 1;
        await fulfillWithWarehouseSchema(route, 'PublicTrackingDto', tracking);
      });
    }
    return reads;
  },
};
