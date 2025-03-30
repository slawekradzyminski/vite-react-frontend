import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AddToCartButton } from './AddToCartButton';
import { CartItemDto } from '../../types/cart';

// Mock the API module
vi.mock('../../lib/api', () => ({
  cart: {
    addToCart: vi.fn(),
  },
}));

describe('AddToCartButton', () => {
  // given
  const mockProductId = 123;
  const mockOnSuccess = vi.fn();
  let user;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  it('renders the add to cart button correctly', () => {
    // when
    render(<AddToCartButton productId={mockProductId} />);

    // then
    expect(screen.getByTestId(`add-to-cart-button-${mockProductId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`add-to-cart-button-${mockProductId}`)).toHaveTextContent('Add to Cart');
  });

  it('renders with a custom data-testid', () => {
    // when
    render(<AddToCartButton productId={mockProductId} data-testid="custom-test-id" />);

    // then
    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
  });

  it('shows quantity controls when the button is clicked', async () => {
    // when
    render(<AddToCartButton productId={mockProductId} />);
    
    // Click the button to show quantity controls
    await user.click(screen.getByTestId(`add-to-cart-button-${mockProductId}`));
    
    // then
    expect(screen.getByTestId(`add-to-cart-quantity-controls-${mockProductId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`add-to-cart-decrease-${mockProductId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`add-to-cart-quantity-${mockProductId}`)).toHaveTextContent('1');
    expect(screen.getByTestId(`add-to-cart-increase-${mockProductId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`add-to-cart-submit-${mockProductId}`)).toHaveTextContent('Add');
  });

  it('increases quantity when the plus button is clicked', async () => {
    // when
    render(<AddToCartButton productId={mockProductId} />);
    
    // Click the main button to show quantity controls
    await user.click(screen.getByTestId(`add-to-cart-button-${mockProductId}`));
    
    // Click the increase button
    await user.click(screen.getByTestId(`add-to-cart-increase-${mockProductId}`));
    
    // then
    expect(screen.getByTestId(`add-to-cart-quantity-${mockProductId}`)).toHaveTextContent('2');
  });

  it('decreases quantity when the minus button is clicked', async () => {
    // when
    render(<AddToCartButton productId={mockProductId} />);
    
    // Click the main button to show quantity controls
    await user.click(screen.getByTestId(`add-to-cart-button-${mockProductId}`));
    
    // Increase quantity to 3
    await user.click(screen.getByTestId(`add-to-cart-increase-${mockProductId}`));
    await user.click(screen.getByTestId(`add-to-cart-increase-${mockProductId}`));
    
    // Click the decrease button
    await user.click(screen.getByTestId(`add-to-cart-decrease-${mockProductId}`));
    
    // then
    expect(screen.getByTestId(`add-to-cart-quantity-${mockProductId}`)).toHaveTextContent('2');
  });

  it('prevents quantity from going below 1', async () => {
    // when
    render(<AddToCartButton productId={mockProductId} />);
    
    // Click the main button to show quantity controls
    await user.click(screen.getByTestId(`add-to-cart-button-${mockProductId}`));
    
    // Try to decrease quantity below 1
    await user.click(screen.getByTestId(`add-to-cart-decrease-${mockProductId}`));
    
    // then
    expect(screen.getByTestId(`add-to-cart-quantity-${mockProductId}`)).toHaveTextContent('1');
  });

  it('adds the item to cart when the Add button is clicked', async () => {
    // given
    const { cart } = await import('../../lib/api');
    vi.mocked(cart.addToCart).mockResolvedValue({} as any);
    
    // when
    render(<AddToCartButton productId={mockProductId} onSuccess={mockOnSuccess} />);
    
    // Click the main button to show quantity controls
    await user.click(screen.getByTestId(`add-to-cart-button-${mockProductId}`));
    
    // Increase quantity to 2
    await user.click(screen.getByTestId(`add-to-cart-increase-${mockProductId}`));
    
    // Click the Add button
    await user.click(screen.getByTestId(`add-to-cart-submit-${mockProductId}`));
    
    // then
    await waitFor(() => {
      const expectedCartItem: CartItemDto = {
        productId: mockProductId,
        quantity: 2
      };
      expect(cart.addToCart).toHaveBeenCalledWith(expectedCartItem);
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('disables the button when isLoading is true', async () => {
    // given
    const { cart } = await import('../../lib/api');
    // Create a promise that won't resolve yet
    let resolvePromise!: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(cart.addToCart).mockReturnValue(promise as any);
    
    // when
    render(<AddToCartButton productId={mockProductId} />);
    
    // Click the main button to show quantity controls
    await user.click(screen.getByTestId(`add-to-cart-button-${mockProductId}`));
    
    // Click the Add button
    await user.click(screen.getByTestId(`add-to-cart-submit-${mockProductId}`));
    
    // then
    expect(screen.getByTestId(`add-to-cart-submit-${mockProductId}`)).toBeDisabled();
    expect(screen.getByTestId(`add-to-cart-submit-${mockProductId}`)).toHaveTextContent('Adding...');
    
    // Resolve the promise to clean up
    resolvePromise({});
  });

  it('disables the button when disabled prop is true', () => {
    // when
    render(<AddToCartButton productId={mockProductId} disabled={true} />);
    
    // then
    expect(screen.getByTestId(`add-to-cart-button-${mockProductId}`)).toBeDisabled();
  });

  it('applies custom className to the button', () => {
    // when
    render(<AddToCartButton productId={mockProductId} className="custom-class" />);
    
    // then
    expect(screen.getByTestId(`add-to-cart-button-${mockProductId}`)).toHaveClass('custom-class');
  });

  it('handles API errors gracefully', async () => {
    // given
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { cart } = await import('../../lib/api');
    vi.mocked(cart.addToCart).mockRejectedValue(new Error('API Error'));
    
    // when
    render(<AddToCartButton productId={mockProductId} />);
    
    // Click the main button to show quantity controls
    await user.click(screen.getByTestId(`add-to-cart-button-${mockProductId}`));
    
    // Click the Add button
    await user.click(screen.getByTestId(`add-to-cart-submit-${mockProductId}`));
    
    // then
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to add item to cart:', expect.any(Error));
      expect(screen.getByTestId(`add-to-cart-submit-${mockProductId}`)).not.toBeDisabled();
      expect(screen.getByTestId(`add-to-cart-submit-${mockProductId}`)).toHaveTextContent('Add');
    });
    
    consoleErrorSpy.mockRestore();
  });
}); 