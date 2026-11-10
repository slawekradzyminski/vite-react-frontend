import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartTendersSummary } from './CartTendersSummary';

describe('CartTendersSummary', () => {
  it('renders nothing without tenders', () => {
    // given / when
    const { container } = render(<CartTendersSummary cart={{ totalPrice: 50 }} prefix="cart" />);
    // then
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing before the summary loads', () => {
    // given / when
    const { container } = render(<CartTendersSummary prefix="checkout" />);
    // then
    expect(container).toBeEmptyDOMElement();
  });

  it('lists the gift card, points and amount due with the given prefix', () => {
    // given
    const cart = { giftCardCode: 'GC-1', giftCardAmount: 25, pointsRedeemed: 1500, pointsAmount: 15, amountDue: 60 };
    // when
    render(<CartTendersSummary cart={cart} prefix="checkout" />);
    // then
    expect(screen.getByTestId('checkout-tenders-gift-card')).toHaveTextContent('−$25.00');
    expect(screen.getByText('Gift card GC-1')).toBeInTheDocument();
    expect(screen.getByText('1,500 points')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-tenders-points')).toHaveTextContent('−$15.00');
    expect(screen.getByTestId('checkout-tenders-amount-due')).toHaveTextContent('$60.00');
  });

  it('omits the tender that is not applied', () => {
    // given / when
    render(<CartTendersSummary cart={{ pointsRedeemed: 100, pointsAmount: 1, amountDue: 9 }} prefix="cart" />);
    // then
    expect(screen.queryByTestId('cart-tenders-gift-card')).not.toBeInTheDocument();
    expect(screen.getByTestId('cart-tenders-points')).toHaveTextContent('−$1.00');
  });
});
