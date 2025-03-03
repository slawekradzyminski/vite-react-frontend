import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { CheckoutPage } from './CheckoutPage';
import * as reactQuery from '@tanstack/react-query';
import { Cart } from '../../types/cart';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />
  };
});

const mockNavigate = vi.fn();

vi.mock('../../lib/api', () => ({
  cart: {
    getCart: vi.fn(),
  },
  products: {
    getProductById: vi.fn().mockImplementation((id) => {
      if (id === 3) {
        return Promise.reject(new Error('Product not found'));
      }
      return Promise.resolve({
        data: {
          id: id,
          name: id === 1 ? 'Test Product 1' : 'Test Product 2',
          price: id === 1 ? 10 : 15.5,
          imageUrl: id === 1 ? 'test-image-1.jpg' : 'test-image-2.jpg',
          description: 'Test description',
          stockQuantity: 10,
          category: 'Test Category'
        }
      });
    }),
  }
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe('CheckoutPage', () => {
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
        unitPrice: 15.5,
        totalPrice: 15.5,
        imageUrl: 'test-image-2.jpg'
      }
    ],
    totalPrice: 35.5,
    totalItems: 3
  };

  const mockCartWithMissingProduct: Cart = {
    username: 'testuser',
    items: [
      {
        productId: 3, // This will cause the product fetch to fail
        productName: 'Missing Product',
        quantity: 1,
        unitPrice: 25,
        totalPrice: 25,
        imageUrl: 'missing-image.jpg'
      }
    ],
    totalPrice: 25,
    totalItems: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state when cart fetch is pending', () => {
    // given
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    // when
    renderWithProviders(<CheckoutPage />);

    // then
    expect(screen.getByText('Loading checkout...')).toBeInTheDocument();
  });

  it('should show error message when cart fetch fails', () => {
    // given
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch cart'),
    } as any);

    // when
    renderWithProviders(<CheckoutPage />);

    // then
    expect(screen.getByText('Error loading cart data')).toBeInTheDocument();
  });

  it('should redirect to cart page when cart is empty', () => {
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
    } as any);

    // when
    renderWithProviders(<CheckoutPage />);

    // then
    const navigateElement = screen.getByTestId('navigate');
    expect(navigateElement).toBeInTheDocument();
    expect(navigateElement.getAttribute('data-to')).toBe('/cart');
  });

  it('should display cart items and total when cart has items', async () => {
    // given
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: { data: mockCartData },
      isLoading: false,
      error: null,
    } as any);

    // when
    renderWithProviders(<CheckoutPage />);

    // then
    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });

    // Check for price displays
    const priceElements = screen.getAllByText(/\$35\.50/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('should handle missing product detail gracefully', async () => {
    // given
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: { data: mockCartWithMissingProduct },
      isLoading: false,
      error: null,
    } as any);

    // when
    renderWithProviders(<CheckoutPage />);

    // then
    await waitFor(() => {
      expect(screen.getByText('Missing Product')).toBeInTheDocument();
      const priceElements = screen.getAllByText('$25.00');
      expect(priceElements.length).toBeGreaterThan(0);
    });
  });
}); 