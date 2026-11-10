import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Tracking } from '../../types/commerce';
import { TrackingTimeline } from './TrackingTimeline';

const shipped: Tracking = {
  shipmentId: 1,
  orderId: 42,
  carrier: 'DHL',
  trackingNumber: '1234567890',
  simulated: true,
  currentStatus: 'DELIVERY_FAILED',
  estimatedDelivery: '2026-11-12T12:00:00',
  events: [
    { status: 'LABEL_CREATED', location: 'Warehouse, Warsaw', description: 'Label printed', occurredAt: '2026-11-10T09:00:00' },
    { status: 'IN_TRANSIT', location: 'DHL Hub, Leipzig', description: 'Sorted at the hub', occurredAt: '2026-11-10T12:00:00' },
    { status: 'DELIVERY_FAILED', location: 'Berlin', description: 'Nobody home', occurredAt: '2026-11-11T09:00:00' },
  ],
};

describe('TrackingTimeline', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lists scans newest first with status, location and time', () => {
    // when
    render(<TrackingTimeline tracking={shipped} />);

    // then
    const events = within(screen.getByTestId('tracking-events')).getAllByRole('listitem');
    expect(events.map((event) => event.getAttribute('data-status'))).toEqual(['DELIVERY_FAILED', 'IN_TRANSIT', 'LABEL_CREATED']);
    expect(within(events[1]).getByTestId('tracking-event-status')).toHaveTextContent('In transit');
    expect(within(events[1]).getByTestId('tracking-event-location')).toHaveTextContent('DHL Hub, Leipzig');
    expect(within(events[1]).getByTestId('tracking-event-time')).toHaveAttribute('dateTime', '2026-11-10T12:00:00');
    expect(screen.getByTestId('tracking-carrier')).toHaveTextContent('DHL');
    expect(screen.getByTestId('tracking-number')).toHaveTextContent('1234567890');
    expect(screen.getByTestId('tracking-estimated-delivery')).toHaveTextContent('Estimated delivery:');
  });

  it('highlights a failed delivery attempt', () => {
    render(<TrackingTimeline tracking={shipped} />);

    expect(screen.getByTestId('tracking-current-status')).toHaveTextContent('Delivery attempt failed');
    expect(screen.getByTestId('tracking-current-status')).toHaveClass('bg-red-100');
    expect(screen.getByTestId('tracking-event-2')).toHaveClass('bg-red-50');
    expect(screen.getByTestId('tracking-event-1')).not.toHaveClass('bg-red-50');
  });

  it('labels the delivery time once delivered', () => {
    render(<TrackingTimeline tracking={{ ...shipped, currentStatus: 'DELIVERED' }} />);
    expect(screen.getByTestId('tracking-estimated-delivery')).toHaveTextContent(/^Delivered:/);
    expect(screen.getByTestId('tracking-current-status')).toHaveClass('bg-emerald-100');
  });

  it('explains a parcel the carrier has not scanned yet', () => {
    render(<TrackingTimeline tracking={{ trackingNumber: 'X1', currentStatus: null, events: [] }} />);
    expect(screen.getByTestId('tracking-current-status')).toHaveTextContent('Awaiting carrier');
    expect(screen.getByTestId('tracking-no-events')).toBeInTheDocument();
    expect(screen.queryByTestId('tracking-estimated-delivery')).not.toBeInTheDocument();
  });

  it('copies the tracking number', async () => {
    // given
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<TrackingTimeline tracking={shipped} />);

    // when
    await user.click(screen.getByRole('button', { name: 'Copy tracking number 1234567890' }));

    // then
    expect(writeText).toHaveBeenCalledWith('1234567890');
    expect(screen.getByTestId('tracking-copy-status')).toHaveTextContent('Copied');
  });

  it('says when copying is not allowed', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    render(<TrackingTimeline tracking={shipped} />);

    await user.click(screen.getByTestId('tracking-copy-number'));

    expect(screen.getByTestId('tracking-copy-status')).toHaveTextContent('Copy failed');
  });
});
