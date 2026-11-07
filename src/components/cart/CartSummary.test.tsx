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

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
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
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
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

  it('does not clear cart when user cancels confirmation', async () => {
    vi.mocked(cart.clearCart).mockResolvedValue({} as any);
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByText('Clear Cart'));
    await waitFor(() => {
      expect(cart.clearCart).not.toHaveBeenCalled();
      expect(mockOnUpdate).not.toHaveBeenCalled();
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
    let resolvePromise!: (value: any) => void;
    const clearCartPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    vi.mocked(cart.clearCart).mockImplementation(() => clearCartPromise as Promise<any>);
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} />);
    
    // when
    const clearButton = screen.getByText('Clear Cart');
    fireEvent.click(clearButton);

    // then
    expect(screen.getByText("Clearing...")).toBeInTheDocument();
    resolvePromise({});
    
    // Wait for the component to update after the promise resolves
    await waitFor(() => {
      expect(screen.queryByText("Clearing...")).not.toBeInTheDocument();
      expect(screen.getByText("Clear Cart")).toBeInTheDocument();
      expect(cart.clearCart).toHaveBeenCalled();
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('saves unsaved quantities before opening checkout', async () => {
    // given
    let saved = false;
    const beforeCheckout = vi.fn(async () => { saved = true; });
    mockNavigate.mockImplementation(() => expect(saved).toBe(true));
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} beforeCheckout={beforeCheckout} />);

    // when
    fireEvent.click(screen.getByTestId('cart-checkout-button'));

    // then
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/checkout'));
    expect(beforeCheckout).toHaveBeenCalledTimes(1);
  });

  it('stays on the cart and explains why when saving changes fails', async () => {
    // given
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const beforeCheckout = vi.fn().mockRejectedValue(new Error('network'));
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} beforeCheckout={beforeCheckout} />);

    // when
    fireEvent.click(screen.getByTestId('cart-checkout-button'));

    // then
    expect(await screen.findByText('Failed to save your cart changes. Please try again.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('confirms a cleared cart with a toast', async () => {
    // given
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(cart.clearCart).mockResolvedValue({} as never);
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} />);

    // when
    fireEvent.click(screen.getByTestId('cart-clear-button'));

    // then
    expect(await screen.findByText('All items have been removed from your cart')).toBeInTheDocument();
  });

  it('disables checkout while unsaved changes are being saved', async () => {
    // given
    let finishSaving: () => void = () => {};
    const beforeCheckout = vi.fn(() => new Promise<void>((resolve) => { finishSaving = resolve; }));
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} beforeCheckout={beforeCheckout} />);

    // when
    fireEvent.click(screen.getByTestId('cart-checkout-button'));

    // then
    expect(await screen.findByRole('button', { name: 'Saving changes...' })).toBeDisabled();
    finishSaving();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/checkout'));
  });

  it('re-enables checkout after a failed save', async () => {
    // given
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} beforeCheckout={vi.fn().mockRejectedValue(new Error('x'))} />);

    // when
    fireEvent.click(screen.getByTestId('cart-checkout-button'));

    // then
    expect(await screen.findByText('Failed to save your cart changes. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proceed to Checkout' })).toBeEnabled();
  });

  it('explains a failed Clear Cart', async () => {
    // given
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(cart.clearCart).mockRejectedValue(new Error('500'));
    renderWithProviders(<CartSummary cartData={mockCartData} onUpdate={mockOnUpdate} />);

    // when
    fireEvent.click(screen.getByTestId('cart-clear-button'));

    // then
    expect(await screen.findByText('Failed to clear cart. Please try again.')).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
});
