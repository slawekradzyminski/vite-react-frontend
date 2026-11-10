import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartLoyaltyPanel } from './CartLoyaltyPanel';
import { cartTenders, loyalty } from '../../lib/api';
import { renderWithRoute } from '../../test/renderWithRoute';
import { axiosError, ok } from '../../test/paymentFixtures';

vi.mock('../../lib/api', () => ({
  loyalty: { account: vi.fn() },
  cartTenders: { applyPoints: vi.fn(), removePoints: vi.fn() },
}));

const account = (balance: number) => ok({ balance, tier: 'SILVER', valueOfBalance: balance / 100, lifetimeEarned: 1800 });

describe('CartLoyaltyPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(loyalty.account).mockResolvedValue(account(1250));
  });

  it('shows the balance and previews the value of the typed points', async () => {
    // given
    renderWithRoute(<CartLoyaltyPanel cart={{}} />);
    // when
    await userEvent.type(await screen.findByLabelText('Points to redeem'), '500');
    // then
    expect(screen.getByTestId('cart-loyalty-balance')).toHaveTextContent('1,250 points (worth $12.50)');
    expect(screen.getByTestId('cart-loyalty-preview')).toHaveTextContent('500 points = −$5.00');
    expect(screen.getByTestId('cart-loyalty-points-input')).toHaveAttribute('step', '100');
    expect(screen.getByTestId('cart-loyalty-points-input')).toHaveAttribute('max', '1200');
  });

  it('applies points in multiples of 100 and refreshes the cart', async () => {
    // given
    vi.mocked(cartTenders.applyPoints).mockResolvedValue(ok({}));
    const { queryClient } = renderWithRoute(<CartLoyaltyPanel cart={{}} />);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    // when
    await userEvent.type(await screen.findByTestId('cart-loyalty-points-input'), '500');
    await userEvent.click(screen.getByTestId('cart-loyalty-apply'));
    // then
    expect(cartTenders.applyPoints).toHaveBeenCalledWith(500);
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart-coupon'] }));
  });

  it('fills the largest redeemable amount', async () => {
    // given
    renderWithRoute(<CartLoyaltyPanel cart={{}} />);
    // when
    await userEvent.click(await screen.findByTestId('cart-loyalty-use-max'));
    // then
    expect(screen.getByTestId('cart-loyalty-points-input')).toHaveValue(1200);
  });

  it('blocks amounts that are not hundreds or exceed the balance', async () => {
    // given
    renderWithRoute(<CartLoyaltyPanel cart={{}} />);
    const input = await screen.findByTestId('cart-loyalty-points-input');
    // when
    await userEvent.type(input, '150');
    // then
    expect(screen.getByTestId('cart-loyalty-validation')).toHaveTextContent('multiples of 100');
    expect(screen.getByTestId('cart-loyalty-apply')).toBeDisabled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    // when
    await userEvent.clear(input);
    await userEvent.type(input, '1300{Enter}');
    // then
    expect(screen.getByTestId('cart-loyalty-validation')).toHaveTextContent('You only have 1,250 points.');
    expect(cartTenders.applyPoints).not.toHaveBeenCalled();
  });

  it('shows the server reason when points cannot be redeemed', async () => {
    // given
    vi.mocked(cartTenders.applyPoints).mockRejectedValue(axiosError(409, { message: 'Points exceed the remaining total' }));
    renderWithRoute(<CartLoyaltyPanel cart={{}} />);
    // when
    await userEvent.type(await screen.findByTestId('cart-loyalty-points-input'), '100{Enter}');
    // then
    expect(await screen.findByTestId('cart-loyalty-error')).toHaveTextContent('Points exceed the remaining total');
  });

  it('shows redeemed points and removes them', async () => {
    // given
    vi.mocked(cartTenders.removePoints).mockResolvedValue(ok({}));
    renderWithRoute(<CartLoyaltyPanel cart={{ pointsRedeemed: 500, pointsAmount: 5 }} />);
    // when
    await userEvent.click(await screen.findByTestId('cart-loyalty-remove'));
    // then
    expect(screen.getByTestId('cart-loyalty-redeemed')).toHaveTextContent('Redeeming 500 points (−$5.00)');
    await waitFor(() => expect(cartTenders.removePoints).toHaveBeenCalled());
    expect(screen.queryByTestId('cart-loyalty-form')).not.toBeInTheDocument();
  });

  it('reports a failed removal', async () => {
    // given
    vi.mocked(cartTenders.removePoints).mockRejectedValue(axiosError(500));
    renderWithRoute(<CartLoyaltyPanel cart={{ pointsRedeemed: 500, pointsAmount: 5 }} />);
    // when
    await userEvent.click(await screen.findByTestId('cart-loyalty-remove'));
    // then
    expect(await screen.findByTestId('cart-loyalty-error')).toHaveTextContent('Unable to remove the points.');
  });

  it('explains the minimum when the balance is below 100 points', async () => {
    // given
    vi.mocked(loyalty.account).mockResolvedValue(account(80));
    // when
    renderWithRoute(<CartLoyaltyPanel cart={{}} />);
    // then
    expect(await screen.findByTestId('cart-loyalty-minimum')).toHaveTextContent('at least 100 points');
    expect(screen.queryByTestId('cart-loyalty-form')).not.toBeInTheDocument();
  });

  it('says points are unavailable when the account cannot be loaded', async () => {
    // given
    vi.mocked(loyalty.account).mockRejectedValue(axiosError(503));
    // when
    renderWithRoute(<CartLoyaltyPanel cart={{}} />);
    // then
    expect(await screen.findByTestId('cart-loyalty-unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('cart-loyalty-form')).not.toBeInTheDocument();
  });
});
