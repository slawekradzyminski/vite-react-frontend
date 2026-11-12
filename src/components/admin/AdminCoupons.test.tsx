import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { coupons } from '../../lib/api';
import { renderWithRoute } from '../../test/renderWithRoute';
import { AdminCoupons } from './AdminCoupons';

vi.mock('../../lib/api', () => ({
  coupons: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const page = (content: unknown[]) => ({ data: { content, pageNumber: 0, pageSize: 50, totalElements: content.length, totalPages: 1 } });

// The backend keeps coupon validity as UTC wall time; the admin picks local time (T-068).
describe('AdminCoupons validity window in a browser east of UTC', () => {
  const originalZone = process.env.TZ;
  beforeAll(() => { process.env.TZ = 'Europe/Warsaw'; });
  afterAll(() => { process.env.TZ = originalZone; });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(coupons.create).mockResolvedValue({ data: {} } as never);
    vi.mocked(coupons.update).mockResolvedValue({ data: {} } as never);
  });

  it('sends the picked local times as UTC instants', async () => {
    // given: 10:00 in Warsaw on 12 November (CET, UTC+1) is 09:00 UTC
    vi.mocked(coupons.list).mockResolvedValue(page([]) as never);
    const user = userEvent.setup();
    renderWithRoute(<AdminCoupons />);
    await user.type(screen.getByTestId('coupon-code'), 'WINTER10');
    await user.type(screen.getByTestId('coupon-value'), '10');
    fireEvent.change(screen.getByTestId('coupon-valid-from'), { target: { value: '2026-11-12T10:00' } });
    fireEvent.change(screen.getByTestId('coupon-valid-until'), { target: { value: '2026-11-30T23:30' } });

    // when
    await user.click(screen.getByTestId('coupon-save'));

    // then
    await waitFor(() => expect(coupons.create).toHaveBeenCalledTimes(1));
    expect(vi.mocked(coupons.create).mock.calls[0][0]).toMatchObject({
      code: 'WINTER10',
      validFrom: '2026-11-12T09:00:00.000Z',
      validUntil: '2026-11-30T22:30:00.000Z',
    });
  });

  it('shows a stored UTC window in local time when editing and saves it unchanged', async () => {
    // given
    vi.mocked(coupons.list).mockResolvedValue(page([{
      id: 5, code: 'WINTER10', description: '', type: 'PERCENTAGE', value: 10, minOrderAmount: null,
      validFrom: '2026-11-12T09:00:00', validUntil: '2026-11-30T22:30:00', maxRedemptions: null, perUserLimit: 1,
      redemptionCount: 0, active: true, status: 'ACTIVE', createdAt: '2026-11-01T10:00:00', updatedAt: '2026-11-01T10:00:00',
    }]) as never);
    const user = userEvent.setup();
    renderWithRoute(<AdminCoupons />);

    // when
    await user.click(await screen.findByTestId('coupon-edit-5'));

    // then
    expect(screen.getByTestId('coupon-valid-from')).toHaveValue('2026-11-12T10:00');
    expect(screen.getByTestId('coupon-valid-until')).toHaveValue('2026-11-30T23:30');
    expect(screen.getByTestId('coupon-row-5')).toHaveTextContent(`until ${new Date(Date.UTC(2026, 10, 30, 22, 30)).toLocaleString()}`);

    // when
    await user.click(screen.getByTestId('coupon-save'));

    // then
    await waitFor(() => expect(coupons.update).toHaveBeenCalledTimes(1));
    expect(vi.mocked(coupons.update).mock.calls[0][1]).toMatchObject({
      validFrom: '2026-11-12T09:00:00.000Z',
      validUntil: '2026-11-30T22:30:00.000Z',
    });
  });
});
