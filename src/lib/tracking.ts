import type { TrackingStatus } from '../types/commerce';

export const TRACKING_STATUS_LABELS: Record<TrackingStatus, string> = {
  LABEL_CREATED: 'Label created',
  IN_TRANSIT: 'In transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERY_FAILED: 'Delivery attempt failed',
  DELIVERED: 'Delivered',
};

// Order pages poll the carrier while the parcel is moving.
export const TRACKING_REFRESH_MS = 30_000;

export function trackingStatusLabel(status?: TrackingStatus | null) {
  return status ? TRACKING_STATUS_LABELS[status] ?? status : 'Awaiting carrier';
}

/** Polling interval for a tracking response: none once delivered. */
export function trackingRefreshInterval(status?: TrackingStatus | null) {
  return status === 'DELIVERED' ? false : TRACKING_REFRESH_MS;
}

export const orderTrackingQueryKey = (orderId: number) => ['order-tracking', orderId] as const;
export const publicTrackingQueryKey = (trackingNumber: string) => ['public-tracking', trackingNumber] as const;

/** Tracking numbers are upper-case letters and digits; spaces people paste in are dropped. */
export function normaliseTrackingNumber(value: string) {
  return value.replace(/\s+/g, '').toUpperCase();
}
