import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GiftCardBalanceChecker } from './GiftCardBalanceChecker';
import { giftCards } from '../../lib/api';
import { renderWithRoute } from '../../test/renderWithRoute';
import { axiosError, ok } from '../../test/paymentFixtures';

vi.mock('../../lib/api', () => ({ giftCards: { balance: vi.fn() } }));

describe('GiftCardBalanceChecker', () => {
  beforeEach(() => vi.resetAllMocks());

  it('shows the balance, status and expiry of a card', async () => {
    // given
    vi.mocked(giftCards.balance).mockResolvedValue(ok({ code: 'GC-1', balance: 25, status: 'ACTIVE', expiresAt: '2027-12-31T23:59:59' }));
    renderWithRoute(<GiftCardBalanceChecker />);
    expect(screen.getByTestId('gift-card-checker-submit')).toBeDisabled();
    // when
    await userEvent.type(screen.getByLabelText('Gift card code'), ' GC-1 ');
    await userEvent.click(screen.getByTestId('gift-card-checker-submit'));
    // then
    expect(giftCards.balance).toHaveBeenCalledWith('GC-1');
    expect(await screen.findByTestId('gift-card-checker-balance')).toHaveTextContent('$25.00');
    expect(screen.getByTestId('gift-card-checker-code')).toHaveTextContent('GC-1');
    expect(screen.getByTestId('gift-card-checker-status')).toHaveTextContent('ACTIVE');
    expect(screen.getByTestId('gift-card-checker-expires')).toHaveTextContent('2027');
  });

  it('omits the expiry for a card without one', async () => {
    // given
    vi.mocked(giftCards.balance).mockResolvedValue(ok({ code: 'GC-2', balance: 0, status: 'REDEEMED', expiresAt: null }));
    renderWithRoute(<GiftCardBalanceChecker />);
    // when
    await userEvent.type(screen.getByTestId('gift-card-checker-input'), 'GC-2{Enter}');
    // then
    expect(await screen.findByTestId('gift-card-checker-status')).toHaveTextContent('REDEEMED');
    expect(screen.queryByTestId('gift-card-checker-expires')).not.toBeInTheDocument();
  });

  it.each([
    [404, {}, 'No gift card has this code.'],
    [429, { message: 'Too many lookups' }, 'Too many lookups'],
  ])('explains a %d', async (status, body, message) => {
    // given
    vi.mocked(giftCards.balance).mockRejectedValue(axiosError(status, body));
    renderWithRoute(<GiftCardBalanceChecker />);
    // when
    await userEvent.type(screen.getByTestId('gift-card-checker-input'), 'NOPE{Enter}');
    // then
    expect(await screen.findByTestId('gift-card-checker-error')).toHaveTextContent(message);
  });
});
