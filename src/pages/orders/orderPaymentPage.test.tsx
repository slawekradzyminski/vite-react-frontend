import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { OrderPaymentPage } from './orderPaymentPage';
import { renderWithRoute } from '../../test/renderWithRoute';

vi.mock('../../components/payments/PaymentPage', () => ({ PaymentPage: () => <div data-testid="payment-page-stub" /> }));

describe('OrderPaymentPage', () => {
  it('renders the payment page and sets the document title', () => {
    // given / when
    renderWithRoute(<OrderPaymentPage />);
    // then
    expect(screen.getByTestId('payment-page-stub')).toBeInTheDocument();
    expect(document.title).toContain('Pay for order');
  });
});
