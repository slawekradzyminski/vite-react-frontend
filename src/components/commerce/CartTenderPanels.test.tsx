import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CartTenderPanels } from './CartTenderPanels';
import { cartCoupon, loyalty } from '../../lib/api';
import { renderWithRoute } from '../../test/renderWithRoute';
import { ok } from '../../test/paymentFixtures';

vi.mock('../../lib/api', () => ({
  cartCoupon: { summary: vi.fn() },
  loyalty: { account: vi.fn() },
  cartTenders: { applyGiftCard: vi.fn(), removeGiftCard: vi.fn(), applyPoints: vi.fn(), removePoints: vi.fn() },
}));

describe('CartTenderPanels', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(loyalty.account).mockResolvedValue(ok({ balance: 1000, valueOfBalance: 10 }));
  });

  it('shows both panels and the amount due from the cart summary', async () => {
    // given
    vi.mocked(cartCoupon.summary).mockResolvedValue(ok({ giftCardCode: 'GC-1', giftCardAmount: 25, amountDue: 74.99 }));
    // when
    renderWithRoute(<CartTenderPanels />);
    // then
    expect(await screen.findByTestId('cart-tenders-amount-due')).toHaveTextContent('$74.99');
    expect(screen.getByTestId('cart-gift-card-code')).toHaveTextContent('GC-1');
    expect(screen.getByTestId('cart-loyalty-panel')).toBeInTheDocument();
  });

  it('shows no summary while nothing is applied', async () => {
    // given
    vi.mocked(cartCoupon.summary).mockResolvedValue(ok({ totalPrice: 99.99 }));
    // when
    renderWithRoute(<CartTenderPanels />);
    // then
    expect(await screen.findByTestId('cart-gift-card-form')).toBeInTheDocument();
    expect(screen.queryByTestId('cart-tenders-summary')).not.toBeInTheDocument();
  });
});
