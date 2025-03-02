import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProductDetails } from './ProductDetails';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-router-dom', () => ({
  useParams: vi.fn().mockReturnValue({ id: '1' }),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('../../lib/api', () => ({
  cart: {
    addToCart: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    updateCartItem: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    removeFromCart: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    getCart: vi.fn().mockResolvedValue({ 
      data: { 
        items: [{ id: 1, productId: 1, quantity: 3 }],
        totalItems: 3,
        totalPrice: 29.97
      } 
    }),
  },
  products: {
    getProductById: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        name: 'Test Product',
        price: 9.99,
        description: 'This is a test product',
        imageUrl: 'test-image.jpg',
        category: 'Test Category',
        stockQuantity: 10
      }
    }),
  },
}));

const mockToast = vi.fn();
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

describe('ProductDetails', () => {
  const mockProduct = {
    data: {
      id: 1,
      name: 'Test Product',
      price: 9.99,
      description: 'This is a test product',
      imageUrl: 'test-image.jpg',
      category: 'Test Category',
      stockQuantity: 10
    }
  };

  const mockOutOfStockProduct = {
    data: {
      ...mockProduct.data,
      stockQuantity: 0
    }
  };

  const mockProductNoImage = {
    data: {
      ...mockProduct.data,
      imageUrl: ''
    }
  };

  const mockQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  let useQuery: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const reactQuery = await import('@tanstack/react-query');
    useQuery = reactQuery.useQuery;
    
    (useQuery as any).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'product') {
        return {
          data: mockProduct,
          isLoading: false,
          error: null,
        };
      }
      if (queryKey[0] === 'cart') {
        return {
          data: {
            data: {
              items: [{ id: 1, productId: 1, quantity: 3 }],
              totalItems: 3,
              totalPrice: 29.97
            }
          },
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });
  });

  const renderWithProviders = (ui: React.ReactNode) => {
    return render(
      <QueryClientProvider client={mockQueryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('renders product details correctly', () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // then
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('This is a test product')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toHaveAttribute('src', 'test-image.jpg');
    expect(screen.getByRole('button', { name: /update cart/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove from cart/i })).toBeInTheDocument();
  });

  it('shows loading state while fetching product', () => {
    // given
    (useQuery as any).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'product') {
        return {
          data: null,
          isLoading: true,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });

    // when
    renderWithProviders(<ProductDetails />);
    
    // then
    expect(screen.getByText('Loading product details...')).toBeInTheDocument();
  });

  it('shows error message when product fetch fails', () => {
    // given
    (useQuery as any).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'product') {
        return {
          data: null,
          isLoading: false,
          error: new Error('Failed to fetch product'),
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });

    // when
    renderWithProviders(<ProductDetails />);
    
    // then
    expect(screen.getByText('Error loading product details')).toBeInTheDocument();
  });

  it('increases quantity when + button is clicked', () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // when
    const plusButton = screen.getByRole('button', { name: '+' });
    fireEvent.click(plusButton);

    // then
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('decreases quantity when - button is clicked', () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // when
    const minusButton = screen.getByRole('button', { name: '-' });
    fireEvent.click(minusButton);

    // then
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('allows decreasing quantity to 0', () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // when
    const minusButton = screen.getByRole('button', { name: '-' });
    fireEvent.click(minusButton); // 3 -> 2
    fireEvent.click(minusButton); // 2 -> 1
    fireEvent.click(minusButton); // 1 -> 0

    // then
    expect(screen.getByText('0')).toBeInTheDocument();
    const removeButtons = screen.getAllByRole('button', { name: /remove from cart/i });
    expect(removeButtons.length).toBe(2);
  });

  it('updates cart item when Update Cart button is clicked for product already in cart', async () => {
    // given
    const { cart } = await import('../../lib/api');
    
    renderWithProviders(<ProductDetails />);
    
    // when
    const updateCartButton = screen.getByRole('button', { name: /update cart/i });
    fireEvent.click(updateCartButton);
    
    // then
    await waitFor(() => {
      expect(cart.updateCartItem).toHaveBeenCalledWith(1, { quantity: 3 });
    });
  });

  it('removes product from cart when quantity is set to 0 and Update Cart button is clicked', async () => {
    // given
    const { cart } = await import('../../lib/api');
    
    renderWithProviders(<ProductDetails />);
    const minusButton = screen.getByRole('button', { name: '-' });
    fireEvent.click(minusButton); // 3 -> 2
    fireEvent.click(minusButton); // 2 -> 1
    fireEvent.click(minusButton); // 1 -> 0
    
    // when
    const removeButtons = screen.getAllByRole('button', { name: /remove from cart/i });
    const blueRemoveButton = removeButtons  .find(button => 
      button.className.includes('bg-blue-600')
    );
    fireEvent.click(blueRemoveButton!);

    // then
    await waitFor(() => {
      expect(cart.removeFromCart).toHaveBeenCalledWith(1);
      expect(cart.updateCartItem).not.toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'success',
        title: 'Removed from cart'
      }));
    });
  });

  it('removes product from cart when Remove from Cart button is clicked', async () => {
    // given
    const { cart } = await import('../../lib/api');
    renderWithProviders(<ProductDetails />);

    // when
    const removeButtons = screen.getAllByRole('button', { name: /remove from cart/i });
    const redRemoveButton = removeButtons.find(button => 
      button.className.includes('bg-red-600')
    );
    fireEvent.click(redRemoveButton!);

    // then
    await waitFor(() => {
      expect(cart.removeFromCart).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'success',
        title: 'Removed from cart'
      }));
    });
  });

  it('adds product to cart when Add to Cart button is clicked for new product', async () => {
    // given
    const { cart } = await import('../../lib/api');
    
    (useQuery as any).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'product') {
        return {
          data: mockProduct,
          isLoading: false,
          error: null,
        };
      }
      if (queryKey[0] === 'cart') {
        return {
          data: {
            data: {
              items: [],
              totalItems: 0,
              totalPrice: 0
            }
          },
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });

    renderWithProviders(<ProductDetails />);
    
    // when
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);
    
    // then
    await waitFor(() => {
      expect(cart.addToCart).toHaveBeenCalledWith({ productId: 1, quantity: 1 });
    });
  });

  it('shows error toast when adding to cart fails', async () => {
    const { cart } = await import('../../lib/api');
    
    (cart.addToCart as any).mockRejectedValueOnce(new Error('Failed to add to cart'));

    // given
    (useQuery as any).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'product') {
        return {
          data: mockProduct,
          isLoading: false,
          error: null,
        };
      }
      if (queryKey[0] === 'cart') {
        return {
          data: {
            data: {
              items: [],
              totalItems: 0,
              totalPrice: 0
            }
          },
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });
    
    renderWithProviders(<ProductDetails />);
    
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'error',
        description: expect.stringContaining('Failed to update cart')
      }));
    });
  });

  it('shows error toast when updating cart fails', async () => {
    const { cart } = await import('../../lib/api');
    
    (cart.updateCartItem as any).mockRejectedValueOnce(new Error('Failed to update cart'));
    
    renderWithProviders(<ProductDetails />);
    
    const updateCartButton = screen.getByRole('button', { name: /update cart/i });
    fireEvent.click(updateCartButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'error',
        description: expect.stringContaining('Failed to update cart')
      }));
    });
  });

  it('shows error toast when removing from cart fails', async () => {
    // given
    const { cart } = await import('../../lib/api');
    (cart.removeFromCart as any).mockRejectedValueOnce(new Error('Failed to remove from cart'));
    renderWithProviders(<ProductDetails />);
    
    // when
    const removeButtons = screen.getAllByRole('button', { name: /remove from cart/i });
    const redRemoveButton = removeButtons.find(button => 
      button.className.includes('bg-red-600')
    );
    fireEvent.click(redRemoveButton!);
    
    // then
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'error',
        description: expect.stringContaining('Failed to remove from cart')
      }));
    });
  });

  it('disables Add to Cart button when product is out of stock', () => {
    // given
    (useQuery as any).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'product') {
        return {
          data: mockOutOfStockProduct,
          isLoading: false,
          error: null,
        };
      }
      if (queryKey[0] === 'cart') {
        return {
          data: {
            data: {
              items: [],
              totalItems: 0,
              totalPrice: 0
            }
          },
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });

    // when
    renderWithProviders(<ProductDetails />);
    
    // then
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addToCartButton).toBeDisabled();
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it('shows no image placeholder when imageUrl is not provided', () => {
    // given
    (useQuery as any).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'product') {
        return {
          data: mockProductNoImage,
          isLoading: false,
          error: null,
        };
      }
      if (queryKey[0] === 'cart') {
        return {
          data: {
            data: {
              items: [],
              totalItems: 0,
              totalPrice: 0
            }
          },
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });

    // when
    renderWithProviders(<ProductDetails />);
    
    // then
    expect(screen.getByText('No image available')).toBeInTheDocument();
  });

  it('renders back to products link', () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // then
    expect(screen.getByText(/back to products/i)).toBeInTheDocument();
  });

  it('displays current cart quantity for the product', () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // then
    expect(screen.getByText('3 in cart')).toBeInTheDocument();
  });

  it('initializes quantity with cart quantity when product is in cart', () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // then
    const quantityElement = screen.getByText('3');
    expect(quantityElement).toBeInTheDocument();
  });
}); 