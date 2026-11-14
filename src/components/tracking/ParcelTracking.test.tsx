import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { tracking } from '../../lib/api';
import { ParcelTracking } from './ParcelTracking';

vi.mock('../../lib/api', () => ({ tracking: { byNumber: vi.fn() } }));

describe('ParcelTracking', () => {
  afterEach(() => vi.clearAllMocks());

  it('shows the carrier timeline of the parcel and a shareable link', async () => {
    // given
    vi.mocked(tracking.byNumber).mockResolvedValue({ data: {
      carrier: 'UPS', trackingNumber: '1Z0000000000000001', currentStatus: 'IN_TRANSIT',
      events: [{ status: 'IN_TRANSIT', location: 'Hub', description: 'Sorted', occurredAt: '2026-11-10T10:00:00' }],
    } } as never);

    // when
    renderWithProviders(<ParcelTracking trackingNumber="1Z0000000000000001" testIdPrefix="parcel-2" />);

    // then
    expect(await screen.findByTestId('tracking-current-status')).toHaveTextContent('In transit');
    expect(tracking.byNumber).toHaveBeenCalledWith('1Z0000000000000001');
    expect(screen.getByTestId('parcel-2-tracking')).toBeInTheDocument();
    expect(screen.getByTestId('parcel-2-tracking-public-link')).toHaveAttribute('href', '/track/1Z0000000000000001');
  });

  it('degrades quietly when tracking is unavailable', async () => {
    vi.mocked(tracking.byNumber).mockRejectedValue(new Error('down'));
    renderWithProviders(<ParcelTracking trackingNumber="0000000000" testIdPrefix="parcel-1" />);
    expect(await screen.findByTestId('parcel-1-tracking-unavailable')).toBeInTheDocument();
  });
});
