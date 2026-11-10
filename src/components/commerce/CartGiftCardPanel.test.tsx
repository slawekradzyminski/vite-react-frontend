import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartGiftCardPanel } from './CartGiftCardPanel';
import { cartTenders } from '../../lib/api';
import { renderWithRoute } from '../../test/renderWithRoute';
import { axiosError, ok } from '../../test/paymentFixtures';

vi.mock('../../lib/api', () => ({
  cartTenders: { applyGiftCard: vi.fn(), removeGiftCard: vi.fn() },
}));

describe('CartGiftCardPanel', () => {
  beforeEach(() => vi.resetAllMocks());

  it('applies a trimmed code and refreshes the cart summary', async () => {
    // given
    vi.mocked(cartTenders.applyGiftCard).mockResolvedValue(ok({}));
    const { queryClient } = renderWithRoute(<CartGiftCardPanel cart={{}} />);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    expect(screen.getByTestId('cart-gift-card-apply')).toBeDisabled();
    // when
    await userEvent.type(screen.getByLabelText('Gift card code'), '  GC-7KQ2-M9XD-4HPA ');
    await userEvent.click(screen.getByTestId('cart-gift-card-apply'));
    // then
    expect(cartTenders.applyGiftCard).toHaveBeenCalledWith('GC-7KQ2-M9XD-4HPA');
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart-coupon'] }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart'] });
    expect(screen.getByLabelText('Gift card code')).toHaveValue('');
  });

  it('shows why a code was rejected', async () => {
    // given
    vi.mocked(cartTenders.applyGiftCard).mockRejectedValue(axiosError(404, { message: 'Gift card not found' }));
    renderWithRoute(<CartGiftCardPanel cart={{}} />);
    // when
    await userEvent.type(screen.getByTestId('cart-gift-card-input'), 'NOPE{Enter}');
    // then
    expect(await screen.findByTestId('cart-gift-card-error')).toHaveTextContent('Gift card not found');
  });

  it('shows the applied card and how much it covers, and removes it', async () => {
    // given
    vi.mocked(cartTenders.removeGiftCard).mockResolvedValue(ok({}));
    renderWithRoute(<CartGiftCardPanel cart={{ giftCardCode: 'GC-1', giftCardAmount: 25 }} />);
    // when
    await userEvent.click(screen.getByTestId('cart-gift-card-remove'));
    // then
    expect(screen.getByTestId('cart-gift-card-code')).toHaveTextContent('GC-1');
    expect(screen.getByTestId('cart-gift-card-amount')).toHaveTextContent('Covers $25.00');
    await waitFor(() => expect(cartTenders.removeGiftCard).toHaveBeenCalled());
    expect(screen.queryByTestId('cart-gift-card-form')).not.toBeInTheDocument();
  });

  it('warns when the applied card cannot be used and reports a failed removal', async () => {
    // given
    vi.mocked(cartTenders.removeGiftCard).mockRejectedValue(axiosError(500));
    renderWithRoute(<CartGiftCardPanel cart={{ giftCardCode: 'GC-1', giftCardAmount: 0 }} />);
    // when
    await userEvent.click(screen.getByTestId('cart-gift-card-remove'));
    // then
    expect(screen.getByTestId('cart-gift-card-unusable')).toBeInTheDocument();
    expect(await screen.findByTestId('cart-gift-card-error')).toHaveTextContent('Unable to remove the gift card.');
  });
});
