import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderDetails } from './OrderDetails';
import { orders, auth } from '../../lib/api';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderStatus } from '../../types/order';
import { ToastContext } from '../../hooks/useToast';

const createOrderResponse = vi.hoisted(() => {
  const baseOrder = {
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
      },
    ],
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country',
    },
  };

  return (overrides: Partial<typeof baseOrder> = {}) => ({
    data: {
      ...baseOrder,
      ...overrides,
      items: overrides.items ?? baseOrder.items,
      shippingAddress: overrides.shippingAddress ?? baseOrder.shippingAddress,
    },
  });
});

vi.mock('../../lib/api', () => ({
  orders: {
    getOrderById: vi.fn().mockResolvedValue(createOrderResponse()),
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
      },
    }),
  },
}));

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
  const mockToast = vi.fn();

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
        <ToastContext.Provider value={{ toast: mockToast }}>
          <BrowserRouter>
            <OrderDetails />
          </BrowserRouter>
        </ToastContext.Provider>
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
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Order Cancelled',
        description: 'Order #1 has been cancelled successfully.',
        variant: 'success',
      });
    });
  });

  it('does not show cancel button for non-pending orders', async () => {
    // given
    vi.mocked(orders.getOrderById).mockResolvedValueOnce({
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
    
    // when
    renderWithProviders();

    // then
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /cancel order/i })).not.toBeInTheDocument();
    });
  });

  it('shows admin controls for admin users', async () => {
    // given
    vi.mocked(auth.me).mockResolvedValueOnce({
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roles: ['ROLE_ADMIN'],
      }
    });
    
    // when
    renderWithProviders();

    // then
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });
  });

  it('does not update order status when admin changes status without clicking update', async () => {
    // given
    vi.mocked(auth.me).mockResolvedValueOnce({
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

    // then
    await waitFor(() => {
      expect(orders.updateOrderStatus).not.toHaveBeenCalled();
    });
  });

  it('updates order status when admin changes status and clicks update', async () => {
    // given
    vi.mocked(auth.me).mockResolvedValueOnce({
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
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Status Updated',
        description: 'Order status has been updated to SHIPPED.',
        variant: 'success',
      });
    });
  });

  it('disables update button when selected status is the same as current status', async () => {
    // given
    vi.mocked(auth.me).mockResolvedValueOnce({
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
      const updateButton = screen.getByRole('button', { name: /update/i });
      expect(updateButton).toBeDisabled();
    });
  });

  it('shows toast error when update status fails', async () => {
    // given
    vi.mocked(auth.me).mockResolvedValueOnce({
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roles: ['ROLE_ADMIN'],
      }
    });
    
    vi.mocked(orders.updateOrderStatus).mockRejectedValueOnce(new Error('Update failed'));
    
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
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to update order status. Please try again.',
        variant: 'error',
      });
    });
  });

  it('does not cancel order when confirmation is rejected', async () => {
    global.confirm = vi.fn().mockReturnValue(false);
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel order/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel order/i }));

    await waitFor(() => {
      expect(orders.cancelOrder).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  it('shows toast error when cancel request fails', async () => {
    global.confirm = vi.fn().mockReturnValue(true);
    vi.mocked(orders.cancelOrder).mockRejectedValueOnce(new Error('fail'));
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel order/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel order/i }));

    await waitFor(() => {
      expect(orders.cancelOrder).toHaveBeenCalledWith(1);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to cancel the order. Please try again.',
        variant: 'error',
      });
    });
  });

  it('initializes admin status select with current order status', async () => {
    vi.mocked(auth.me).mockResolvedValueOnce({
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roles: ['ROLE_ADMIN'],
      },
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('order-details-status-select')).toHaveValue('PENDING');
    });
  });

  it.each([
    ['PENDING', 'bg-yellow-100 text-yellow-800'],
    ['PAID', 'bg-blue-100 text-blue-800'],
    ['SHIPPED', 'bg-purple-100 text-purple-800'],
    ['DELIVERED', 'bg-green-100 text-green-800'],
    ['CANCELLED', 'bg-red-100 text-red-800'],
  ] as Array<[OrderStatus, string]>)('applies %s styling for %s status', async (status, className) => {
    vi.mocked(orders.getOrderById).mockResolvedValueOnce(createOrderResponse({ status }));

    renderWithProviders();

    await waitFor(() => {
      const badge = screen.getByTestId('order-details-status');
      expect(badge).toHaveClass(className);
    });
  });
}); 
