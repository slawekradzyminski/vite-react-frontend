import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderDetails } from './OrderDetails';
import { orders, auth } from '../../lib/api';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderStatus } from '../../types/order';

// Mock the API
vi.mock('../../lib/api', () => ({
  orders: {
    getOrderById: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        userId: 1,
        status: 'PENDING' as OrderStatus,
        totalAmount: 39.98,
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z',
        items: [
          {
            id: 1,
            productId: 1,
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 19.99,
            totalPrice: 39.98,
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country',
        }
      }
    }),
    cancelOrder: vi.fn().mockResolvedValue({ success: true }),
    updateOrderStatus: vi.fn().mockResolvedValue({ success: true }),
  },
  auth: {
    me: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['ROLE_USER'],
      }
    }),
  },
}));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '1' }),
  };
});

describe('OrderDetails', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OrderDetails />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders order details correctly', async () => {
    // given
    renderWithProviders();

    // then
    await waitFor(() => {
      expect(orders.getOrderById).toHaveBeenCalledWith(1);
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$19.99 x 2')).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'p' && 
               element?.classList.contains('font-bold') && 
               content.includes('$39.98');
      })).toBeInTheDocument();
      expect(screen.getByText('123 Test St')).toBeInTheDocument();
      expect(screen.getByText('Test City, Test State 12345')).toBeInTheDocument();
      expect(screen.getByText('Test Country')).toBeInTheDocument();
    });
  });

  it('shows cancel button for pending orders', async () => {
    // given
    renderWithProviders();

    // then
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel order/i })).toBeInTheDocument();
    });
  });

  it('cancels order when cancel button is clicked', async () => {
    // given
    global.confirm = vi.fn().mockReturnValue(true);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel order/i })).toBeInTheDocument();
    });

    // when
    fireEvent.click(screen.getByRole('button', { name: /cancel order/i }));

    // then
    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
      expect(orders.cancelOrder).toHaveBeenCalledWith(1);
    });
  });

  it('does not show cancel button for non-pending orders', async () => {
    // given
    // Mock a different order status
    (orders.getOrderById as jest.Mock).mockResolvedValueOnce({
      data: {
        id: 1,
        userId: 1,
        status: 'DELIVERED' as OrderStatus,
        totalAmount: 39.98,
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z',
        items: [
          {
            id: 1,
            productId: 1,
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 19.99,
            totalPrice: 39.98,
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country',
        }
      }
    });
    
    renderWithProviders();

    // then
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /cancel order/i })).not.toBeInTheDocument();
    });
  });

  it('shows admin controls for admin users', async () => {
    // given
    // Mock admin user
    (auth.me as jest.Mock).mockResolvedValueOnce({
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roles: ['ROLE_ADMIN'],
      }
    });
    
    renderWithProviders();

    // then
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });
  });

  it('updates order status when admin changes status', async () => {
    // given
    // Mock admin user
    (auth.me as jest.Mock).mockResolvedValueOnce({
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roles: ['ROLE_ADMIN'],
      }
    });
    
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // when
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'SHIPPED' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    // then
    await waitFor(() => {
      expect(orders.updateOrderStatus).toHaveBeenCalledWith(1, 'SHIPPED');
    });
  });
}); 