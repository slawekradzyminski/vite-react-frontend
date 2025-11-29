import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import { CartPage } from './CartPage';
import { Cart } from '../../types/cart';
import type { Product } from '../../types/product';
import type { AxiosResponse } from 'axios';
import * as reactQuery from '@tanstack/react-query';
import { products } from '../../lib/api';

const createAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

const defaultProductLookup = (id: number) =>
  Promise.resolve(
    createAxiosResponse<Product>({
      id,
      name: id === 1 ? 'Test Product 1' : 'Test Product 2',
      price: id === 1 ? 10 : 15,
      imageUrl: id === 1 ? 'test-image-1.jpg' : 'test-image-2.jpg',
      description: 'Test description',
      stockQuantity: 10,
      category: 'Test Category',
      createdAt: '2023-01-01T12:00:00Z',
      updatedAt: '2023-01-02T12:00:00Z',
    })
  );

vi.mock('../../lib/api', () => ({
  cart: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
  },
  products: {
    getProductById: vi.fn().mockImplementation((id) => defaultProductLookup(id)),
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe('CartPage', () => {
  const mockCartData: Cart = {
    username: 'testuser',
    items: [
      {
        productId: 1,
        productName: 'Test Product 1',
        quantity: 2,
        unitPrice: 10,
        totalPrice: 20,
        imageUrl: 'test-image-1.jpg'
      },
      {
        productId: 2,
        productName: 'Test Product 2',
        quantity: 1,
        unitPrice: 15,
        totalPrice: 15,
        imageUrl: 'test-image-2.jpg'
      }
    ],
    totalPrice: 35,
    totalItems: 3
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(products.getProductById).mockImplementation((id) => defaultProductLookup(id));
  });

  it('displays loading state initially', () => {
    // given
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);
    
    // when
    renderWithProviders(<CartPage />);
    
    // then
    expect(screen.getByText('Loading cart...')).toBeInTheDocument();
  });

  it('displays cart items when data is loaded', async () => {
    // given
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: { data: mockCartData },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    
    // when
    renderWithProviders(<CartPage />);
    
    // then
    // Use waitFor to handle async rendering
    await waitFor(() => {
      expect(screen.getByText(/Test Product 1/)).toBeInTheDocument();
      expect(screen.getByText(/Test Product 2/)).toBeInTheDocument();
    });
    
    expect(screen.getByRole('heading', { name: 'Cart Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cart Items' })).toBeInTheDocument();
    
    // Check for table headers
    expect(screen.getByRole('columnheader', { name: 'Product' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Price' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Quantity' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Total' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    
    // Check for cart summary details
    await waitFor(() => {
      const itemsElements = screen.getAllByText('Items');
      expect(itemsElements.length).toBeGreaterThan(0);
    });
    
    await waitFor(() => {
      const totalElements = screen.getAllByText(/\$35\.00/);
      expect(totalElements.length).toBeGreaterThan(0);
    });
  });

  it('displays empty cart message when cart has no items', async () => {
    // given
    const emptyCart: Cart = {
      username: 'testuser',
      items: [],
      totalPrice: 0,
      totalItems: 0
    };
    
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: { data: emptyCart },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    
    // when
    renderWithProviders(<CartPage />);
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      expect(screen.getByText('Browse Products')).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    // given
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
      refetch: vi.fn(),
    } as any);

    // when
    renderWithProviders(<CartPage />);

    // then
    expect(screen.getByText('Error loading cart')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('retries loading cart when retry button is clicked', async () => {
    const refetch = vi.fn();
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
      refetch,
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<CartPage />);

    await user.click(screen.getByTestId('cart-retry'));
    expect(refetch).toHaveBeenCalled();
  });

  it('falls back to minimal product details when enrichment fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: {
        data: {
          username: 'testuser',
          items: [
            {
              productId: 99,
              quantity: 1,
              unitPrice: 25,
              totalPrice: 25,
            } as any,
          ],
          totalPrice: 25,
          totalItems: 1,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(products.getProductById).mockRejectedValueOnce(new Error('boom'));

    renderWithProviders(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText('Unknown Product')).toBeInTheDocument();
    });
    expect(screen.getByTestId('cart-item-total-99')).toHaveTextContent('$25.00');
    consoleErrorSpy.mockRestore();
  });
}); 
