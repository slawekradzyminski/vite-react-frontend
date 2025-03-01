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

vi.mock('../../lib/api', () => ({
  cart: {
    addToCart: vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ data: { id: 1 } }), 100);
      });
    })
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

  it('adds product to cart when Add to Cart button is clicked', async () => {
    // given
    const user = userEvent.setup();
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    // when
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    
    // then
    expect(cart.addToCart).toHaveBeenCalledWith({
      productId: 1,
      quantity: 1
    });
  });

  it('disables the Add to Cart button while adding to cart', async () => {
    // given
    const user = userEvent.setup();
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    // when
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Adding...')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add to cart/i })).not.toBeDisabled();
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
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    
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
}); 