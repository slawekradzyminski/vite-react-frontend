import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProductDetails } from './ProductDetails';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLocation, useParams } from 'react-router';
import { AxiosError, AxiosHeaders } from 'axios';

vi.mock('react-router', () => ({
  useParams: vi.fn().mockReturnValue({ id: '1' }),
  useLocation: vi.fn().mockReturnValue({ pathname: '/products/1', search: '', state: null }),
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
    expect(document.title).toBe('Product details – Awesome Testing');
  });

  it('treats a response without product data as not found', () => {
    // given
    (useQuery as any).mockImplementation(() => ({ data: null, isLoading: false, error: null }));

    // when
    renderWithProviders(<ProductDetails />);

    // then
    expect(screen.getByRole('alert')).toHaveTextContent('Product not found');
    expect(document.title).toBe('Product not found – Awesome Testing');
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
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('data-testid', 'product-not-found');
    expect(screen.getByRole('heading', { level: 1, name: 'Product unavailable' })).toBeInTheDocument();
    expect(alert).toHaveTextContent('Error loading product details');
    expect(document.title).toBe('Product unavailable – Awesome Testing');
  });

  it('names the quantity controls and announces the value', () => {
    // given
    renderWithProviders(<ProductDetails />);
    const value = screen.getByTestId('quantity-value');

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));

    // then
    expect(screen.getByRole('group', { name: 'Quantity' })).toContainElement(value);
    expect(value).toHaveAttribute('aria-live', 'polite');
    expect(value).toHaveTextContent('4');
    expect(document.title).toBe('Test Product – Awesome Testing');
  });

  it('renders relative image paths without rewriting them', () => {
    (useQuery as any).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'product') {
        return {
          data: {
            data: {
              ...mockProduct.data,
              imageUrl: '/images/iphone.png',
            },
          },
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
              totalPrice: 29.97,
            },
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

    expect(screen.getByAltText('Test Product')).toHaveAttribute('src', '/images/iphone.png');
  });

  it('increases quantity when + button is clicked', () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // when
    const plusButton = screen.getByRole('button', { name: 'Increase quantity' });
    fireEvent.click(plusButton);

    // then
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('decreases quantity when - button is clicked', () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // when
    const minusButton = screen.getByRole('button', { name: 'Decrease quantity' });
    fireEvent.click(minusButton);

    // then
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not decrease quantity below 1', () => {
    // given
    renderWithProviders(<ProductDetails />);
    
    // when
    const minusButton = screen.getByRole('button', { name: 'Decrease quantity' });
    fireEvent.click(minusButton); // 3 -> 2
    fireEvent.click(minusButton); // 2 -> 1

    // then
    expect(screen.getByTestId('quantity-value')).toHaveTextContent('1');
    expect(minusButton).toBeDisabled();
    expect(screen.getByTestId('add-to-cart')).toHaveTextContent('Update Cart');
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

  it('updates instead of removing when Update Cart is clicked at quantity 1', async () => {
    // given
    const { cart } = await import('../../lib/api');
    
    renderWithProviders(<ProductDetails />);
    const minusButton = screen.getByRole('button', { name: 'Decrease quantity' });
    fireEvent.click(minusButton); // 3 -> 2
    fireEvent.click(minusButton); // 2 -> 1
    
    // when
    fireEvent.click(screen.getByTestId('add-to-cart'));

    // then
    await waitFor(() => {
      expect(cart.updateCartItem).toHaveBeenCalledWith(1, { quantity: 1 });
    });
    expect(cart.removeFromCart).not.toHaveBeenCalled();
  });

  it('removes product from cart when Remove from Cart button is clicked', async () => {
    // given
    const { cart } = await import('../../lib/api');
    renderWithProviders(<ProductDetails />);

    // when
    fireEvent.click(screen.getByTestId('remove-from-cart'));

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
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
    consoleErrorSpy.mockRestore();
  });

  it('shows error toast when updating cart fails', async () => {
    const { cart } = await import('../../lib/api');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
    consoleErrorSpy.mockRestore();
  });

  it('shows error toast when removing from cart fails', async () => {
    // given
    const { cart } = await import('../../lib/api');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (cart.removeFromCart as any).mockRejectedValueOnce(new Error('Failed to remove from cart'));
    renderWithProviders(<ProductDetails />);
    
    // when
    fireEvent.click(screen.getByTestId('remove-from-cart'));
    
    // then
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'error',
        description: expect.stringContaining('Failed to remove from cart')
      }));
    });
    consoleErrorSpy.mockRestore();
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

  const httpError = (status: number) =>
    new AxiosError('failed', 'ERR', undefined, undefined, {
      status,
      statusText: '',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });

  it.each(['abc', '1.5', '0', '1abc', '-3'])('shows "not found" for the invalid id %s without requesting it (BUG-006)', (id) => {
    // given
    vi.mocked(useParams).mockReturnValueOnce({ id });
    (useQuery as any).mockImplementation(({ queryKey }) => (
      queryKey[0] === 'product'
        ? { data: undefined, isLoading: false, error: null }
        : { data: null, isLoading: false, error: null }
    ));

    // when
    renderWithProviders(<ProductDetails />);

    // then
    const productQuery = (useQuery as any).mock.calls.find(([options]) => options.queryKey[0] === 'product')[0];
    expect(productQuery.enabled).toBe(false);
    expect(productQuery.retry(0, httpError(400))).toBe(false);
    expect(screen.getByRole('heading', { level: 1, name: 'Product not found' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('This product does not exist or may have been removed.');
  });

  it('reports a 404 as a missing product, not a loading error', () => {
    // given
    (useQuery as any).mockImplementation(({ queryKey }) => (
      queryKey[0] === 'product'
        ? { data: undefined, isLoading: false, error: httpError(404) }
        : { data: null, isLoading: false, error: null }
    ));

    // when
    renderWithProviders(<ProductDetails />);

    // then
    expect(screen.getByRole('alert')).toHaveTextContent('This product does not exist or may have been removed.');
    expect(screen.queryByText('Error loading product details')).not.toBeInTheDocument();
  });

  it('explains a stock conflict with the refreshed availability', async () => {
    // given
    const { cart } = await import('../../lib/api');
    vi.mocked(cart.updateCartItem).mockRejectedValueOnce(httpError(409));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const refetch = vi.fn().mockResolvedValue({ data: { data: { ...mockProduct.data, stockQuantity: 2 } } });
    (useQuery as any).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'product') {
        return { data: mockProduct, isLoading: false, error: null, refetch };
      }
      return { data: { data: { items: [{ productId: 1, quantity: 3 }] } }, isLoading: false, error: null };
    });
    renderWithProviders(<ProductDetails />);

    // when
    fireEvent.click(screen.getByTestId('add-to-cart'));

    // then
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'error',
      description: 'Only 2 left in stock.',
    })));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('quantity-value')).toHaveTextContent('2');
  });

  it('returns to the product list with the filters it was opened from', () => {
    // given
    // Re-renders after the cart quantity effect read the location again, so this cannot be a one-off value.
    vi.mocked(useLocation).mockReturnValue({ pathname: '/products/1', search: '', state: { productsSearch: '?category=Books&sort=price-desc' } } as never);

    // when
    renderWithProviders(<ProductDetails />);

    // then
    expect(screen.getByRole('link', { name: '← Back to Products' })).toHaveAttribute('href', '/products?category=Books&sort=price-desc');
    vi.mocked(useLocation).mockReturnValue({ pathname: '/products/1', search: '', state: null } as never);
  });

  it('ignores a back-link state that is not a query string', () => {
    // given
    vi.mocked(useLocation).mockReturnValue({ pathname: '/products/1', search: '', state: { productsSearch: '//evil.example' } } as never);

    // when
    renderWithProviders(<ProductDetails />);

    // then
    expect(screen.getByRole('link', { name: '← Back to Products' })).toHaveAttribute('href', '/products');
    vi.mocked(useLocation).mockReturnValue({ pathname: '/products/1', search: '', state: null } as never);
  });

  it('formats prices with thousands separators', () => {
    // given
    (useQuery as any).mockImplementation(({ queryKey }) => (
      queryKey[0] === 'product'
        ? { data: { data: { ...mockProduct.data, price: 1999.99 } }, isLoading: false, error: null }
        : { data: null, isLoading: false, error: null }
    ));

    // when
    renderWithProviders(<ProductDetails />);

    // then
    expect(screen.getByTestId('product-price')).toHaveTextContent('$1,999.99');
  });

  it('requests a valid multi-digit id and stops "+" at the stock', () => {
    // given
    vi.mocked(useParams).mockReturnValue({ id: '12' });
    (useQuery as any).mockImplementation(({ queryKey }) => (
      queryKey[0] === 'product'
        ? { data: { data: { ...mockProduct.data, id: 12, stockQuantity: 1 } }, isLoading: false, error: null }
        : { data: null, isLoading: false, error: null }
    ));

    // when
    renderWithProviders(<ProductDetails />);

    // then
    const productQuery = (useQuery as any).mock.calls.find(([options]) => options.queryKey[0] === 'product')[0];
    expect(productQuery.enabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
    expect(screen.getByTestId('add-to-cart')).toBeEnabled();
    vi.mocked(useParams).mockReturnValue({ id: '1' });
  });

  it('says the product sold out when the conflict leaves no stock', async () => {
    // given
    const { cart } = await import('../../lib/api');
    vi.mocked(cart.updateCartItem).mockRejectedValueOnce(httpError(409));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const refetch = vi.fn().mockResolvedValue({ data: { data: { ...mockProduct.data, stockQuantity: 0 } } });
    (useQuery as any).mockImplementation(({ queryKey }) => (
      queryKey[0] === 'product'
        ? { data: mockProduct, isLoading: false, error: null, refetch }
        : { data: { data: { items: [{ productId: 1, quantity: 3 }] } }, isLoading: false, error: null }
    ));
    renderWithProviders(<ProductDetails />);

    // when
    fireEvent.click(screen.getByTestId('add-to-cart'));

    // then
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: 'This product is now out of stock.' })));
  });

  it('keeps the generic message and does not refetch for other cart failures', async () => {
    // given
    const { cart } = await import('../../lib/api');
    vi.mocked(cart.updateCartItem).mockRejectedValueOnce(httpError(500));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const refetch = vi.fn();
    (useQuery as any).mockImplementation(({ queryKey }) => (
      queryKey[0] === 'product'
        ? { data: mockProduct, isLoading: false, error: null, refetch }
        : { data: { data: { items: [{ productId: 1, quantity: 3 }] } }, isLoading: false, error: null }
    ));
    renderWithProviders(<ProductDetails />);

    // when
    fireEvent.click(screen.getByTestId('add-to-cart'));

    // then
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Failed to update cart. Please try again.' })));
    expect(refetch).not.toHaveBeenCalled();
  });
});
