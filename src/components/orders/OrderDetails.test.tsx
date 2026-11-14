import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderDetails } from './OrderDetails';
import { orders, auth, warehouse, payments, adminOrders } from '../../lib/api';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderStatus } from '../../types/order';
import { Role } from '../../types/auth';
import { ToastContext } from '../../hooks/useToast';
import type { AxiosResponse } from 'axios';
import type { Order } from '../../types/order';
import type { User } from '../../types/auth';

function createAuthResponse(overrides: Partial<User> = {}): AxiosResponse<User> {
  const baseUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['ROLE_CLIENT' as Role],
  };

  return {
    data: {
      ...baseUser,
      ...overrides,
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };
}

const createOrderResponse = vi.hoisted(() => {
  const baseOrder: Order = {
    id: 1,
    username: 'testuser',
    status: 'PENDING',
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

  return (overrides: Partial<Order> = {}): AxiosResponse<Order> => ({
    data: {
      ...baseOrder,
      ...overrides,
      items: overrides.items ?? baseOrder.items,
      shippingAddress: overrides.shippingAddress ?? baseOrder.shippingAddress,
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  });
});

const transport = vi.hoisted(() => ({ value: 'rest' as 'rest' | 'graphql' }));
vi.mock('../../lib/commerceTransport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/commerceTransport')>()),
  get commerceTransport() {
    return transport.value;
  },
}));

vi.mock('../../lib/api', async () => ({
  ...(await import('../../test/commerceApiMocks')).commerceApiMocks(),
  orders: {
    getOrderById: vi.fn().mockResolvedValue(createOrderResponse()),
    cancelOrder: vi.fn().mockResolvedValue({ success: true }),
    updateOrderStatus: vi.fn().mockResolvedValue({ success: true }),
  },
  auth: {
    me: vi.fn().mockResolvedValue(createAuthResponse()),
  },
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
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

  describe('delivery section', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('neither shows nor requests shipment tracking when a build disables warehouse-service', async () => {
      vi.stubEnv('VITE_WAREHOUSE_ENABLED', 'false');
      vi.mocked(orders.getOrderById).mockResolvedValueOnce(createOrderResponse({ status: 'DELIVERED' }));
      renderWithProviders();

      expect(await screen.findByText('Order #1')).toBeInTheDocument();
      expect(screen.queryByTestId('order-fulfilment')).not.toBeInTheDocument();
      expect(screen.queryByTestId('order-return-open')).not.toBeInTheDocument();
      expect(warehouse.parcels).not.toHaveBeenCalled();
    });

    it('keeps warehouse calls out of GraphQL mode', async () => {
      transport.value = 'graphql';
      try {
        vi.mocked(orders.getOrderById).mockResolvedValueOnce(createOrderResponse({ status: 'DELIVERED' }));
        renderWithProviders();

        expect(await screen.findByText('Order #1')).toBeInTheDocument();
        expect(screen.queryByTestId('order-fulfilment')).not.toBeInTheDocument();
        expect(warehouse.parcels).not.toHaveBeenCalled();
      } finally {
        transport.value = 'rest';
      }
    });

    it('shows shipment tracking by default', async () => {
      renderWithProviders();

      expect(await screen.findByTestId('order-fulfilment')).toBeInTheDocument();
      await waitFor(() => expect(warehouse.parcels).toHaveBeenCalledWith(1));
    });
  });

  describe('payment section', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('shows the payment panel for the order by default', async () => {
      // given / when
      renderWithProviders();

      // then
      expect(await screen.findByTestId('order-payment-panel')).toBeInTheDocument();
      await waitFor(() => expect(payments.forOrder).toHaveBeenCalledWith(1));
    });

    it('neither shows nor requests payments when a build disables payment-service', async () => {
      // given
      vi.stubEnv('VITE_PAYMENT_ENABLED', 'false');

      // when
      renderWithProviders();

      // then
      expect(await screen.findByText('Order #1')).toBeInTheDocument();
      expect(screen.queryByTestId('order-payment-panel')).not.toBeInTheDocument();
      expect(payments.forOrder).not.toHaveBeenCalled();
    });
  });

  it('shows the VAT contained in the total', async () => {
    // given
    vi.mocked(orders.getOrderById).mockResolvedValueOnce(createOrderResponse({ taxRate: 23, taxAmount: 7.48, netAmount: 32.5, taxCountry: 'PL' }));

    // when
    renderWithProviders();

    // then
    expect(await screen.findByTestId('order-details-vat')).toHaveTextContent('Includes VAT 23% (PL): $7.48, net: $32.50');
  });

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

  it('cancels order after the in-app confirmation, without a native confirm()', async () => {
    // given
    const nativeConfirm = vi.fn().mockReturnValue(true);
    global.confirm = nativeConfirm;
    queryClient.invalidateQueries = vi.fn();
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('order-details-cancel-button')).toBeInTheDocument();
    });

    // when
    fireEvent.click(screen.getByTestId('order-details-cancel-button'));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel order #1?' });
    expect(dialog).toHaveAccessibleDescription(/Are you sure you want to cancel this order\?/);
    expect(orders.cancelOrder).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('order-cancel-dialog-confirm'));

    // then
    await waitFor(() => {
      expect(nativeConfirm).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(orders.cancelOrder).toHaveBeenCalledWith(1);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['products'] });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['inventory'] });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Order Cancelled',
        description: 'Order #1 has been cancelled successfully.',
        variant: 'success',
      });
    });
  });

  it('does not show cancel button for non-pending orders', async () => {
    // given
    vi.mocked(orders.getOrderById).mockResolvedValueOnce(
      createOrderResponse({ status: 'DELIVERED' })
    );
    
    // when
    renderWithProviders();

    // then
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /cancel order/i })).not.toBeInTheDocument();
    });
  });

  it('shows admin controls for admin users', async () => {
    // given
    vi.mocked(auth.me).mockResolvedValueOnce(
      createAuthResponse({
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: [Role.ADMIN],
      })
    );
    
    // when
    renderWithProviders();

    // then
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Order status' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });
  });

  it('does not update order status when admin changes status without clicking update', async () => {
    // given
    vi.mocked(auth.me).mockResolvedValueOnce(
      createAuthResponse({
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: [Role.ADMIN],
      })
    );
    
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Order status' })).toBeInTheDocument();
    });

    // when
    fireEvent.change(screen.getByRole('combobox', { name: 'Order status' }), { target: { value: 'SHIPPED' } });

    // then
    await waitFor(() => {
      expect(orders.updateOrderStatus).not.toHaveBeenCalled();
    });
  });

  it('updates order status when admin changes status and clicks update', async () => {
    // given
    vi.mocked(auth.me).mockResolvedValueOnce(
      createAuthResponse({
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: [Role.ADMIN],
      })
    );
    
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Order status' })).toBeInTheDocument();
    });

    // when
    fireEvent.change(screen.getByRole('combobox', { name: 'Order status' }), { target: { value: 'SHIPPED' } });
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

  it('refreshes stock views when an administrator changes status to cancelled', async () => {
    vi.mocked(auth.me).mockResolvedValueOnce(
      createAuthResponse({
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: [Role.ADMIN],
      })
    );
    queryClient.invalidateQueries = vi.fn();
    renderWithProviders();

    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Order status' })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox', { name: 'Order status' }), { target: { value: 'CANCELLED' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(orders.updateOrderStatus).toHaveBeenCalledWith(1, 'CANCELLED');
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['products'] });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['inventory'] });
    });
  });

  it('disables update button when selected status is the same as current status', async () => {
    // given
    vi.mocked(auth.me).mockResolvedValueOnce(
      createAuthResponse({
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: [Role.ADMIN],
      })
    );
    
    renderWithProviders();
    
    // then
    await waitFor(() => {
      const updateButton = screen.getByRole('button', { name: /update/i });
      expect(updateButton).toBeDisabled();
    });
  });

  it('shows toast error when update status fails', async () => {
    // given
    vi.mocked(auth.me).mockResolvedValueOnce(
      createAuthResponse({
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: [Role.ADMIN],
      })
    );
    
    vi.mocked(orders.updateOrderStatus).mockRejectedValueOnce(new Error('Update failed'));
    
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Order status' })).toBeInTheDocument();
    });

    // when
    fireEvent.change(screen.getByRole('combobox', { name: 'Order status' }), { target: { value: 'SHIPPED' } });
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

  it.each([
    ['Keep order', () => fireEvent.click(screen.getByTestId('order-cancel-dialog-keep'))],
    ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
  ])('does not cancel the order when the confirmation is dismissed with %s', async (_label, dismiss) => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('order-details-cancel-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('order-details-cancel-button'));
    await screen.findByTestId('order-cancel-dialog');
    dismiss();

    await waitFor(() => expect(screen.queryByTestId('order-cancel-dialog')).not.toBeInTheDocument());
    expect(orders.cancelOrder).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('shows toast error when cancel request fails', async () => {
    vi.mocked(orders.cancelOrder).mockRejectedValueOnce(new Error('fail'));
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('order-details-cancel-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('order-details-cancel-button'));
    fireEvent.click(await screen.findByTestId('order-cancel-dialog-confirm'));

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
    vi.mocked(auth.me).mockResolvedValueOnce(
      createAuthResponse({
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: [Role.ADMIN],
      })
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('order-details-status-select')).toHaveValue('PENDING');
    });
  });

  it.each([
    ['PENDING', 'border-amber-200 bg-amber-50 text-amber-800'],
    ['PAID', 'border-stone-200 bg-stone-50 text-slate-600'],
    ['SHIPPED', 'border-stone-200 bg-white/85 text-slate-600'],
    ['DELIVERED', 'border-emerald-200 bg-emerald-50 text-emerald-800'],
    ['CANCELLED', 'border-red-200 bg-red-50 text-red-800'],
  ] as Array<[OrderStatus, string]>)('applies %s styling for %s status', async (status, className) => {
    vi.mocked(orders.getOrderById).mockResolvedValueOnce(createOrderResponse({ status }));

    renderWithProviders();

    await waitFor(() => {
      const badge = screen.getByTestId('order-details-status');
      expect(badge).toHaveClass(className);
    });
  });
  describe('stock reservation', () => {
    const admin = () => vi.mocked(auth.me).mockResolvedValue(createAuthResponse({ username: 'admin', roles: [Role.ADMIN] }));

    afterEach(() => {
      vi.mocked(auth.me).mockResolvedValue(createAuthResponse());
    });

    it('shows how long a PENDING order stays reserved', async () => {
      vi.mocked(orders.getOrderById).mockResolvedValueOnce(createOrderResponse({ reservationExpiresAt: new Date(Date.now() + 10 * 60_000).toISOString() }));
      renderWithProviders();

      expect(await screen.findByTestId('reservation-countdown')).toHaveTextContent(/Reserved until \d\d:\d\d/);
      expect(screen.getByTestId('reservation-countdown-remaining')).toHaveTextContent(/^(10:00|9:5\d) left to pay$/);
    });

    it('says the reservation expired on an order the backend cancelled for it', async () => {
      vi.mocked(orders.getOrderById).mockResolvedValueOnce(createOrderResponse({
        status: 'CANCELLED', reservationExpiresAt: '2026-11-14T10:30:00.000Z', updatedAt: '2026-11-14T10:30:04Z',
      }));
      renderWithProviders();

      expect(await screen.findByTestId('reservation-expired')).toBeInTheDocument();
      expect(screen.queryByTestId('reservation-countdown')).not.toBeInTheDocument();
    });

    it('lets an administrator expire the reservation of a PENDING order now', async () => {
      admin();
      vi.mocked(orders.getOrderById).mockResolvedValue(createOrderResponse({ reservationExpiresAt: new Date(Date.now() + 60_000).toISOString() }));
      vi.mocked(adminOrders.expireReservation).mockResolvedValueOnce(createOrderResponse({
        status: 'CANCELLED', reservationExpiresAt: '2026-11-14T10:30:00.000Z', updatedAt: '2026-11-14T10:30:00.000Z',
      }));
      renderWithProviders();

      fireEvent.click(await screen.findByTestId('order-details-expire-reservation'));

      await waitFor(() => expect(adminOrders.expireReservation).toHaveBeenCalledWith(1));
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Reservation expired', variant: 'success' }));
      vi.mocked(orders.getOrderById).mockResolvedValue(createOrderResponse());
    });

    it('shows why the backend refused to expire a reservation', async () => {
      admin();
      vi.mocked(adminOrders.expireReservation).mockRejectedValueOnce({
        isAxiosError: true, response: { status: 409, data: { message: 'Only PENDING orders hold a reservation; order is PAID' } },
      });
      renderWithProviders();

      fireEvent.click(await screen.findByTestId('order-details-expire-reservation'));

      await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Only PENDING orders hold a reservation; order is PAID', variant: 'error',
      })));
    });

    it('offers the expiry only to administrators and only for PENDING orders', async () => {
      renderWithProviders();
      expect(await screen.findByText('Order #1')).toBeInTheDocument();
      expect(screen.queryByTestId('order-details-expire-reservation')).not.toBeInTheDocument();
    });

    it('hides the expiry for orders that are no longer PENDING', async () => {
      admin();
      vi.mocked(orders.getOrderById).mockResolvedValueOnce(createOrderResponse({ status: 'PAID' }));
      renderWithProviders();

      expect(await screen.findByTestId('order-details-admin-controls')).toBeInTheDocument();
      expect(screen.queryByTestId('order-details-expire-reservation')).not.toBeInTheDocument();
    });
  });
}); 
