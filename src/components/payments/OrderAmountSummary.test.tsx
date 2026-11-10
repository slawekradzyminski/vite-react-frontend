import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderAmountSummary } from './OrderAmountSummary';
import { orderFixture } from '../../test/paymentFixtures';

describe('OrderAmountSummary', () => {
  it('shows only the total and amount due for a plain order', () => {
    // given / when
    render(<OrderAmountSummary order={orderFixture()} />);
    // then
    expect(screen.getByTestId('payment-order-total')).toHaveTextContent('$59.97');
    expect(screen.getByTestId('payment-order-amount-due')).toHaveTextContent('$59.97');
    expect(screen.queryByTestId('payment-order-vat')).not.toBeInTheDocument();
    expect(screen.queryByTestId('payment-order-gift-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('payment-order-points')).not.toBeInTheDocument();
  });

  it('shows VAT, gift card and points tenders', () => {
    // given
    const order = orderFixture({
      totalAmount: 123, taxAmount: 23, taxRate: 23, taxCountry: 'PL',
      giftCardCode: 'GC-AAAA', giftCardAmount: 25, pointsRedeemed: 1500, pointsAmount: 15, amountDue: 83,
    });
    // when
    render(<OrderAmountSummary order={order} />);
    // then
    expect(screen.getByTestId('payment-order-vat-label')).toHaveTextContent('incl. VAT 23% (PL)');
    expect(screen.getByTestId('payment-order-vat')).toHaveTextContent('$23.00');
    expect(screen.getByTestId('payment-order-gift-card')).toHaveTextContent('−$25.00');
    expect(screen.getByText('Gift card GC-AAAA')).toBeInTheDocument();
    expect(screen.getByText('1,500 loyalty points')).toBeInTheDocument();
    expect(screen.getByTestId('payment-order-points')).toHaveTextContent('−$15.00');
    expect(screen.getByTestId('payment-order-amount-due')).toHaveTextContent('$83.00');
  });

  it('labels VAT without rate or country when the backend omits them', () => {
    // given / when
    render(<OrderAmountSummary order={orderFixture({ taxAmount: 5 })} />);
    // then
    expect(screen.getByTestId('payment-order-vat-label')).toHaveTextContent(/^incl\. VAT$/);
  });
});
