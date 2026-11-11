import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { tracking } from '../../lib/api';
import { OrderTracking } from './OrderTracking';

vi.mock('../../lib/api', () => ({ tracking: { forOrder: vi.fn() } }));

describe('OrderTracking', () => {
  afterEach(() => vi.clearAllMocks());

  it('shows the carrier timeline and a shareable link', async () => {
    // given
    vi.mocked(tracking.forOrder).mockResolvedValue({ data: {
      orderId: 501, carrier: 'UPS', trackingNumber: '1Z0000000000000001', currentStatus: 'IN_TRANSIT',
      events: [{ status: 'IN_TRANSIT', location: 'Hub', description: 'Sorted', occurredAt: '2026-11-10T10:00:00' }],
    } } as never);

    // when
    renderWithProviders(<OrderTracking orderId={501} />);

    // then
    expect(await screen.findByTestId('tracking-current-status')).toHaveTextContent('In transit');
    expect(tracking.forOrder).toHaveBeenCalledWith(501);
    expect(screen.getByTestId('order-tracking-public-link')).toHaveAttribute('href', '/track/1Z0000000000000001');
  });

  it('degrades quietly when tracking is unavailable', async () => {
    vi.mocked(tracking.forOrder).mockRejectedValue(new Error('down'));
    renderWithProviders(<OrderTracking orderId={502} />);
    expect(await screen.findByTestId('order-tracking-unavailable')).toBeInTheDocument();
  });
});
