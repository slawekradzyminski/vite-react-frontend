import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import { ProductCard } from './ProductCard';
import { Product } from '../../types/product';
import { cart } from '../../lib/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn().mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'cart') {
        return {
          data: {
            data: {
              items: [
                { productId: 1, quantity: 2 }
              ],
              totalItems: 2,
              totalPrice: 39.98
            }
          }
        };
      }
      return { data: null };
    }),
    useQueryClient: () => ({
      invalidateQueries: vi.fn()
    })
  };
});

vi.mock('../../lib/api', () => ({
  cart: {
    addToCart: vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ data: { id: 1 } }), 100);
      });
    }),
    updateCartItem: vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ data: { id: 1 } }), 100);
      });
    }),
    getCart: vi.fn()
  }
}));

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 19.99,
    stockQuantity: 10,
    category: 'Test Category',
    imageUrl: 'test-image.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockOutOfStockProduct: Product = {
    ...mockProduct,
    id: 2,
    stockQuantity: 0
  };

  const mockProductNoImage: Product = {
    ...mockProduct,
    id: 3,
    imageUrl: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product information correctly', () => {
    // given
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    // then
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'test-image.jpg');
  });

  it('shows out of stock message when stock is 0', () => {
    // given
    renderWithProviders(<ProductCard product={mockOutOfStockProduct} />);
    
    // then
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });

  it('updates cart item when Update Cart button is clicked for product already in cart', async () => {
    // given
    const user = userEvent.setup();
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    // when
    await user.click(screen.getByRole('button', { name: /update cart/i }));
    
    // then
    expect(cart.updateCartItem).toHaveBeenCalledWith(1, {
      quantity: 2
    });
    expect(cart.addToCart).not.toHaveBeenCalled();
  });

  it('disables the Add to Cart button while adding to cart', async () => {
    // given
    const user = userEvent.setup();
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    // when
    await user.click(screen.getByRole('button', { name: /update cart/i }));
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Adding...')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update cart/i })).not.toBeDisabled();
    });
  });

  it('navigates to product details page when card is clicked', async () => {
    // given
    const user = userEvent.setup();
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    // when
    await user.click(screen.getByText('Test Product'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith(`/products/${mockProduct.id}`);
  });

  it('prevents navigation when Add to Cart button is clicked', async () => {
    // given
    const user = userEvent.setup();
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    // when
    await user.click(screen.getByRole('button', { name: /update cart/i }));
    
    // then
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('prevents navigation when quantity buttons are clicked', async () => {
    // given
    const user = userEvent.setup();
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    // when
    await user.click(screen.getByRole('button', { name: /\+/i }));
    
    // then
    expect(mockNavigate).not.toHaveBeenCalled();
    
    // when
    await user.click(screen.getByRole('button', { name: /-/i }));
    
    // then
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows no image placeholder when imageUrl is not provided', () => {
    // given
    renderWithProviders(<ProductCard product={mockProductNoImage} />);
    
    // then
    expect(screen.getByText('No image available')).toBeInTheDocument();
  });

  it('displays current cart quantity for the product', () => {
    // given
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    // then
    expect(screen.getByText('2 in cart')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update cart/i })).toBeInTheDocument();
  });
}); 