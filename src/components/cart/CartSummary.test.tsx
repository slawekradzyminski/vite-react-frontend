import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { CartSummary } from './CartSummary';
import { cart } from '../../lib/api';
import { Cart } from '../../types/cart';

vi.mock('../../lib/api', () => ({
  cart: {
    clearCart: vi.fn(),
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockNavigate = vi.fn();

describe('CartSummary', () => {
  const mockCartData: Cart = {
    username: 'testuser',
    items: [
      {
        productId: 1,
        productName: 'Test Product 1',
        quantity: 2,
        unitPrice: 10,
        totalPrice: 20
      },
      {
        productId: 2,
        productName: 'Test Product 2',
        quantity: 1,
        unitPrice: 15,
        totalPrice: 15
      }
    ],
    totalPrice: 35,
    totalItems: 3
  };
  
  const mockOnUpdate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });
  
  it('renders the cart summary correctly', () => {
    // when
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} />);
    
    // then
    expect(screen.getByText('Cart Summary')).toBeInTheDocument();
    expect(screen.getByText('Items:')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('$35.00')).toBeInTheDocument();
  });
  
  it('navigates to checkout when Proceed to Checkout button is clicked', () => {
    // given
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} />);
    
    // when
    const checkoutButton = screen.getByText('Proceed to Checkout');
    fireEvent.click(checkoutButton);
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
  
  it('calls clearCart when Clear Cart button is clicked', async () => {
    // given
    vi.mocked(cart.clearCart).mockResolvedValue({} as any);
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} />);
    
    // when
    const clearButton = screen.getByText('Clear Cart');
    fireEvent.click(clearButton);
    
    // then
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear your cart?');
      expect(cart.clearCart).toHaveBeenCalled();
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });
  
  it('disables buttons when cart is empty', () => {
    // given
    const emptyCart: Cart = {
      username: 'testuser',
      items: [],
      totalPrice: 0,
      totalItems: 0
    };
    
    // when
    renderWithProviders(<CartSummary cartData={emptyCart} onUpdate={mockOnUpdate} />);
    
    // then
    expect(screen.getByText('Proceed to Checkout')).toBeDisabled();
    expect(screen.getByText('Clear Cart')).toBeDisabled();
  });
  
  it('shows Clearing... text when clearing cart', async () => {
    // given
    vi.mocked(cart.clearCart).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({} as any), 100))
    );
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} />);
    
    // when
    const clearButton = screen.getByText('Clear Cart');
    fireEvent.click(clearButton);

    // then
    expect(screen.getByText("Clearing...")).toBeInTheDocument();
    await waitFor(() => {
      expect(cart.clearCart).toHaveBeenCalled();
    });
  });
}); 