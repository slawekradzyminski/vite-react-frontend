import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { adminPayments } from '../../lib/api';
import type { Payment } from '../../types/payment';
import { AdminPayments } from './AdminPayments';
import { ok, page } from '../../test/webhookFixtures';
import { renderWithQuery } from '../../test/queryWrapper';

vi.mock('../../lib/api', () => ({
  adminPayments: { list: vi.fn() },
}));

const payment = (overrides: Partial<Payment> = {}): Payment => ({
  id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
  orderId: 42,
  amount: 40,
  currency: 'USD',
  refundedAmount: 0,
  cardBrand: 'VISA',
  cardLast4: '4242',
  status: 'CAPTURED',
  createdAt: '2026-11-10T10:00:00Z',
  updatedAt: '2026-11-10T10:00:00Z',
  ...overrides,
});

describe('AdminPayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists payments with amount, card and status', async () => {
    // given
    vi.mocked(adminPayments.list).mockResolvedValue(ok(page([
      payment(),
      payment({ id: 'p2', status: 'FAILED', failureCode: 'card_declined', failureMessage: 'Declined', currency: 'EUR', amount: 10 }),
      payment({ id: 'p3', status: 'PARTIALLY_REFUNDED', refundedAmount: 5, currency: 'XYZ1' }),
    ])) as never);

    // when
    renderWithQuery(<AdminPayments />);

    // then
    const row = await screen.findByTestId('admin-payment-row-1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed');
    expect(row).toHaveTextContent('#42');
    expect(row).toHaveTextContent('VISA •••• 4242');
    expect(screen.getByTestId('admin-payment-amount-1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')).toHaveTextContent('$40.00');
    expect(screen.getByTestId('admin-payment-status-p2')).toHaveTextContent('FAILED');
    expect(screen.getByTestId('admin-payment-row-p2')).toHaveTextContent('card_declined: Declined');
    expect(screen.getByTestId('admin-payment-amount-p2')).toHaveTextContent('€10.00');
    expect(screen.getByTestId('admin-payment-status-p3')).toHaveTextContent('PARTIALLY REFUNDED');
    expect(screen.getByTestId('admin-payment-amount-p3')).toHaveTextContent('refunded 5.00 XYZ1');
  });

  it('filters by status and pages through results', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(adminPayments.list).mockResolvedValue(ok(page([payment()], 3)) as never);
    renderWithQuery(<AdminPayments />);
    await screen.findByTestId('admin-payment-row-1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed');

    // when
    await user.click(screen.getByTestId('admin-payments-next-page'));
    await waitFor(() => expect(adminPayments.list).toHaveBeenLastCalledWith(undefined, 1, 20));
    await user.selectOptions(screen.getByLabelText('Status'), 'REFUNDED');

    // then
    await waitFor(() => expect(adminPayments.list).toHaveBeenLastCalledWith('REFUNDED', 0, 20));
  });

  it('shows empty and error states', async () => {
    // given
    vi.mocked(adminPayments.list).mockResolvedValueOnce(ok(page([], 0)) as never);
    const { unmount } = renderWithQuery(<AdminPayments />);

    // then
    expect(await screen.findByTestId('admin-payments-empty')).toBeInTheDocument();
    unmount();

    // given
    vi.mocked(adminPayments.list).mockRejectedValueOnce(new Error('down'));
    renderWithQuery(<AdminPayments />);

    // then
    expect(await screen.findByTestId('admin-payments-error')).toBeInTheDocument();
  });
});
