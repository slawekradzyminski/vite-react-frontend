import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import { Product } from '../../types/product';
import { cart } from '../../lib/api';
import { BrowserRouter } from 'react-router-dom';

// Mock the cart API
vi.mock('../../lib/api', () => ({
  cart: {
    addToCart: vi.fn().mockResolvedValue({ data: { id: 1 } }),
  },
}));

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    description: 'Test description',
    price: 19.99,
    stockQuantity: 10,
    category: 'Test Category',
    imageUrl: 'https://example.com/image.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product information correctly', () => {
    // given
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    // then
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('10 in stock')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('shows out of stock message when stock is 0', () => {
    // given
    const outOfStockProduct = { ...mockProduct, stockQuantity: 0 };
    
    // when
    render(
      <BrowserRouter>
        <ProductCard product={outOfStockProduct} />
      </BrowserRouter>
    );

    // then
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeDisabled();
  });

  it('adds product to cart when Add to Cart button is clicked', async () => {
    // given
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

    // then
    await waitFor(() => {
      expect(cart.addToCart).toHaveBeenCalledWith({
        productId: 1,
        quantity: 1,
      });
    });
  });

  it('disables the Add to Cart button while adding to cart', async () => {
    // given
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );
    
    // when
    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    
    // then
    expect(screen.getByRole('button', { name: 'Adding...' })).toBeDisabled();
    
    // Wait for the operation to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add to Cart' })).not.toBeDisabled();
    });
  });
}); 