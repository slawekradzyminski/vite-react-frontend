import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { tracking } from '../../lib/api';
import { TrackingPage } from './trackingPage';

vi.mock('../../lib/api', () => ({ tracking: { byNumber: vi.fn() } }));

const LocationProbe = () => <output data-testid="location">{useLocation().pathname}</output>;

const renderAt = (path: string) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/track" element={<TrackingPage />} />
        <Route path="/track/:number" element={<TrackingPage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  </QueryClientProvider>,
);

describe('TrackingPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('validates the number before looking it up', async () => {
    // given
    renderAt('/track');

    // when
    await userEvent.click(screen.getByTestId('public-tracking-submit'));

    // then
    expect(screen.getByTestId('public-tracking-input-error')).toHaveTextContent('Enter a tracking number');
    expect(screen.getByLabelText('Tracking number')).toHaveAttribute('aria-invalid', 'true');
    expect(tracking.byNumber).not.toHaveBeenCalled();
    expect(document.title).toContain('Track a parcel');
  });

  it('opens the deep link for a submitted number', async () => {
    // given
    vi.mocked(tracking.byNumber).mockResolvedValue({ data: { carrier: 'DHL', trackingNumber: '1234567890', currentStatus: 'OUT_FOR_DELIVERY', events: [] } } as never);
    renderAt('/track');

    // when
    await userEvent.type(screen.getByLabelText('Tracking number'), ' 12345 67890{Enter}');

    // then
    expect(screen.getByTestId('location')).toHaveTextContent('/track/1234567890');
    expect(await screen.findByTestId('tracking-current-status')).toHaveTextContent('Out for delivery');
    expect(tracking.byNumber).toHaveBeenCalledWith('1234567890');
  });

  it('looks up the number from the URL', async () => {
    vi.mocked(tracking.byNumber).mockResolvedValue({ data: { carrier: 'UPS', trackingNumber: '1Z999', currentStatus: 'DELIVERED', events: [] } } as never);
    renderAt('/track/1z999');

    expect(await screen.findByTestId('tracking-current-status')).toHaveTextContent('Delivered');
    expect(tracking.byNumber).toHaveBeenCalledWith('1Z999');
    expect(screen.getByTestId('public-tracking-input')).toHaveValue('1Z999');
  });

  it('says when no parcel has the number', async () => {
    vi.mocked(tracking.byNumber).mockRejectedValue(Object.assign(new Error('nf'), { isAxiosError: true, response: { status: 404 } }));
    renderAt('/track/0000000000');

    expect(await screen.findByTestId('public-tracking-not-found')).toHaveTextContent('No parcel with tracking number 0000000000 was found.');
  });

  it('reports other lookup failures', async () => {
    vi.mocked(tracking.byNumber).mockRejectedValue(new Error('down'));
    renderAt('/track/1111111111');

    expect(await screen.findByTestId('public-tracking-error')).toHaveTextContent('Tracking is unavailable right now.');
  });
});
