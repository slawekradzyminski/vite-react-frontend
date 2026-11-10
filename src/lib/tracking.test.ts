import { describe, expect, it } from 'vitest';
import { TRACKING_REFRESH_MS, normaliseTrackingNumber, trackingRefreshInterval, trackingStatusLabel } from './tracking';

describe('tracking helpers', () => {
  it('labels every carrier status and the state before hand-over', () => {
    expect(trackingStatusLabel('LABEL_CREATED')).toBe('Label created');
    expect(trackingStatusLabel('IN_TRANSIT')).toBe('In transit');
    expect(trackingStatusLabel('OUT_FOR_DELIVERY')).toBe('Out for delivery');
    expect(trackingStatusLabel('DELIVERY_FAILED')).toBe('Delivery attempt failed');
    expect(trackingStatusLabel('DELIVERED')).toBe('Delivered');
    expect(trackingStatusLabel(null)).toBe('Awaiting carrier');
  });

  it('polls every 30 seconds until the parcel is delivered', () => {
    expect(TRACKING_REFRESH_MS).toBe(30_000);
    expect(trackingRefreshInterval('IN_TRANSIT')).toBe(30_000);
    expect(trackingRefreshInterval('DELIVERY_FAILED')).toBe(30_000);
    expect(trackingRefreshInterval(undefined)).toBe(30_000);
    expect(trackingRefreshInterval('DELIVERED')).toBe(false);
  });

  it('drops spaces and upper-cases tracking numbers', () => {
    expect(normaliseTrackingNumber(' 1z 999aa1 ')).toBe('1Z999AA1');
  });
});
