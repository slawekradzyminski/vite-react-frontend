import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartPage } from './cartPage';
import { renderWithProviders } from '../../test/test-utils';

// Mock the CartPageComponent
vi.mock('../../components/cart/CartPage', () => ({
  CartPage: () => <div data-testid="mocked-cart-page-component">Cart Page Component</div>
}));

describe('CartPage', () => {
  // given
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the cart page container with correct styling', () => {
    // when
    renderWithProviders(<CartPage />);
    
    // then
    const container = screen.getByTestId('cart-page-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('container');
    expect(container).toHaveClass('mx-auto');
    expect(container).toHaveClass('px-4');
    expect(container).toHaveClass('py-8');
  });

  it('renders the CartPageComponent inside the container', () => {
    // when
    renderWithProviders(<CartPage />);
    
    // then
    const cartPageComponent = screen.getByTestId('mocked-cart-page-component');
    expect(cartPageComponent).toBeInTheDocument();
    expect(cartPageComponent).toHaveTextContent('Cart Page Component');
  });

  it('ensures CartPageComponent is a child of the container', () => {
    // when
    renderWithProviders(<CartPage />);
    
    // then
    const container = screen.getByTestId('cart-page-container');
    const cartPageComponent = screen.getByTestId('mocked-cart-page-component');
    expect(container).toContainElement(cartPageComponent);
  });
}); 