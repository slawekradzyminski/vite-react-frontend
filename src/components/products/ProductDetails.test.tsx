import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductDetails } from './ProductDetails';
import { products, cart } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn().mockReturnValue({ id: '1' }),
  };
});

vi.mock('../../lib/api', () => ({
  products: {
    getProductById: vi.fn(),
  },
  cart: {
    addToCart: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

import { useQuery } from '@tanstack/react-query';

describe('ProductDetails', () => {
  const mockProduct = {
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
    (products.getProductById as any).mockResolvedValue({ data: mockProduct });
    (cart.addToCart as any).mockResolvedValue({ data: { id: 1 } });
    
    (useQuery as any).mockReturnValue({
      data: { data: mockProduct },
      isLoading: false,
      error: null,
    });
  });

  it('renders product details correctly', async () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('10 in stock')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('shows loading state while fetching product', () => {
    // given
    (useQuery as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    
    // when
    renderWithProviders(<ProductDetails />);
    
    // then
    expect(screen.getByText('Loading product details...')).toBeInTheDocument();
  });

  it('shows error message when product fetch fails', async () => {
    // given
    (useQuery as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });
    
    // when
    renderWithProviders(<ProductDetails />);
    
    // then
    expect(screen.getByText('Error loading product details')).toBeInTheDocument();
  });

  it('increases quantity when + button is clicked', async () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // when
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('+'));
    
    // then
    expect(screen.getByText('2')).toBeInTheDocument(); // Quantity increased from 1 to 2
  });

  it('decreases quantity when - button is clicked', async () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // when
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    // First increase to 2
    fireEvent.click(screen.getByText('+'));
    // Then decrease back to 1
    fireEvent.click(screen.getByText('-'));
    
    // then
    expect(screen.getByText('1')).toBeInTheDocument(); // Quantity back to 1
  });

  it('does not decrease quantity below 1', async () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // when
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('-'));
    
    // then
    expect(screen.getByText('1')).toBeInTheDocument(); // Quantity still 1
  });

  it('adds product to cart when Add to Cart button is clicked', async () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // when
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    
    // then
    await waitFor(() => {
      expect(cart.addToCart).toHaveBeenCalledWith({
        productId: 1,
        quantity: 1,
      });
    });
    
    expect(screen.getByText('Item added to cart successfully!')).toBeInTheDocument();
  });

  it('disables Add to Cart button when product is out of stock', async () => {
    // given
    const outOfStockProduct = { ...mockProduct, stockQuantity: 0 };
    (useQuery as any).mockReturnValue({
      data: { data: outOfStockProduct },
      isLoading: false,
      error: null,
    });
    
    // when
    renderWithProviders(<ProductDetails />);
    
    // then
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeDisabled();
  });

  it('shows no image placeholder when imageUrl is not provided', async () => {
    // given
    const productWithoutImage = { ...mockProduct, imageUrl: '' };
    (useQuery as any).mockReturnValue({
      data: { data: productWithoutImage },
      isLoading: false,
      error: null,
    });
    
    // when
    renderWithProviders(<ProductDetails />);
    
    // then
    expect(screen.getByText('No image available')).toBeInTheDocument();
  });

  it('renders back to products link', async () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // when
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    // then
    const backLink = screen.getByText('← Back to Products');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/products');
  });
}); 