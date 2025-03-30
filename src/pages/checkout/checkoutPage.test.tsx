import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutPage } from './checkoutPage';
import { renderWithProviders } from '../../test/test-utils';

// Mock the CheckoutPageComponent
vi.mock('../../components/checkout/CheckoutPage', () => ({
  CheckoutPage: () => <div data-testid="mocked-checkout-page-component">Checkout Page Component</div>
}));

describe('CheckoutPage', () => {
  // given
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the checkout page container with correct styling', () => {
    // when
    renderWithProviders(<CheckoutPage />);
    
    // then
    const container = screen.getByTestId('checkout-page-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('container');
    expect(container).toHaveClass('mx-auto');
    expect(container).toHaveClass('px-4');
    expect(container).toHaveClass('py-8');
  });

  it('renders the CheckoutPageComponent inside the container', () => {
    // when
    renderWithProviders(<CheckoutPage />);
    
    // then
    const checkoutPageComponent = screen.getByTestId('mocked-checkout-page-component');
    expect(checkoutPageComponent).toBeInTheDocument();
    expect(checkoutPageComponent).toHaveTextContent('Checkout Page Component');
  });

  it('ensures CheckoutPageComponent is a child of the container', () => {
    // when
    renderWithProviders(<CheckoutPage />);
    
    // then
    const container = screen.getByTestId('checkout-page-container');
    const checkoutPageComponent = screen.getByTestId('mocked-checkout-page-component');
    expect(container).toContainElement(checkoutPageComponent);
  });
}); 