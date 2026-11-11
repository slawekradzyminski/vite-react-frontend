import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoyaltyTransactions } from './LoyaltyTransactions';
import { loyalty } from '../../lib/api';
import { renderWithRoute } from '../../test/renderWithRoute';
import { axiosError, ok } from '../../test/paymentFixtures';

vi.mock('../../lib/api', () => ({ loyalty: { transactions: vi.fn() } }));

const page = (pageNumber: number, totalPages: number, content: object[]) => ok({ content, pageNumber, pageSize: 10, totalElements: content.length, totalPages });

describe('LoyaltyTransactions', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lists signed points, balance and the order link', async () => {
    // given
    vi.mocked(loyalty.transactions).mockResolvedValue(page(0, 1, [
      { id: 7, type: 'EARNED', points: 120, balanceAfter: 1250, orderId: 42, createdAt: '2026-11-01T10:00:00' },
      { id: 8, type: 'REDEEMED', points: -500, balanceAfter: 750, orderId: null, createdAt: '2026-11-02T10:00:00' },
    ]));
    // when
    renderWithRoute(<LoyaltyTransactions />);
    // then
    expect(await screen.findByTestId('loyalty-transaction-points-7')).toHaveTextContent('+120');
    expect(screen.getByTestId('loyalty-transaction-points-8')).toHaveTextContent('-500');
    expect(screen.getByTestId('loyalty-transaction-type-8')).toHaveTextContent('REDEEMED');
    expect(screen.getByTestId('loyalty-transaction-order-7')).toHaveAttribute('href', '/orders/42');
    expect(screen.queryByTestId('loyalty-transaction-order-8')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loyalty-transactions-pagination')).not.toBeInTheDocument();
    expect(loyalty.transactions).toHaveBeenCalledWith(0, 10);
  });

  it('pages through the history', async () => {
    // given
    vi.mocked(loyalty.transactions)
      .mockResolvedValueOnce(page(0, 2, [{ id: 1, type: 'EARNED', points: 10, balanceAfter: 10 }]))
      .mockResolvedValueOnce(page(1, 2, [{ id: 2, type: 'EARNED', points: 20, balanceAfter: 30 }]))
      .mockResolvedValueOnce(page(0, 2, [{ id: 1, type: 'EARNED', points: 10, balanceAfter: 10 }]));
    renderWithRoute(<LoyaltyTransactions />);
    expect(await screen.findByTestId('loyalty-transactions-page')).toHaveTextContent('Page 1 of 2');
    expect(screen.getByTestId('loyalty-transactions-prev')).toBeDisabled();
    // when
    await userEvent.click(screen.getByTestId('loyalty-transactions-next'));
    // then
    expect(await screen.findByTestId('loyalty-transaction-2')).toBeInTheDocument();
    expect(screen.getByTestId('loyalty-transactions-page')).toHaveTextContent('Page 2 of 2');
    expect(screen.getByTestId('loyalty-transactions-next')).toBeDisabled();
    expect(loyalty.transactions).toHaveBeenLastCalledWith(1, 10);
    // when
    await userEvent.click(screen.getByTestId('loyalty-transactions-prev'));
    // then
    expect(await screen.findByTestId('loyalty-transaction-1')).toBeInTheDocument();
  });

  it('shows an empty state and an error state', async () => {
    // given
    vi.mocked(loyalty.transactions).mockResolvedValueOnce(page(0, 0, []));
    const { unmount } = renderWithRoute(<LoyaltyTransactions />);
    // then
    expect(await screen.findByTestId('loyalty-transactions-empty')).toBeInTheDocument();
    unmount();
    // given
    vi.mocked(loyalty.transactions).mockRejectedValueOnce(axiosError(500));
    // when
    renderWithRoute(<LoyaltyTransactions />);
    // then
    expect(await screen.findByTestId('loyalty-transactions-error')).toBeInTheDocument();
  });
});
