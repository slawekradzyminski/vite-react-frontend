import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { orders } from '../../lib/api';
import { ToastProvider } from '../ui/ToastProvider';
import { OrderDetails } from './OrderDetails';

vi.mock('../../lib/api', async () => ({
  ...(await import('../../test/commerceApiMocks')).commerceApiMocks(),
  orders: { getOrderById: vi.fn(), cancelOrder: vi.fn(), updateOrderStatus: vi.fn() },
  auth: { me: vi.fn().mockResolvedValue({ data: { roles: ['ROLE_CLIENT'] } }) },
}));

// The app's query client retries failed reads; the order read must not retry a 4xx.
function renderOrder(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: 3, retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <ToastProvider>
          <Routes><Route path="/orders/:id" element={<OrderDetails />} /></Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('OrderDetails route id (T-064)', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(['9223372036854775807', '0', 'abc', '1.5'])('shows "Order not found" for /orders/%s without a request', async (id) => {
    // given / when
    renderOrder(`/orders/${id}`);

    // then
    expect(await screen.findByTestId('order-details-not-found')).toHaveTextContent('Order not found');
    expect(screen.queryByTestId('order-details-loading')).not.toBeInTheDocument();
    expect(orders.getOrderById).not.toHaveBeenCalled();
  });

  it('asks once for an order the backend does not know', async () => {
    // given
    vi.mocked(orders.getOrderById).mockRejectedValue(Object.assign(new Error('Not Found'), { isAxiosError: true, response: { status: 404, data: {} } }));

    // when
    renderOrder('/orders/77');

    // then
    expect(await screen.findByTestId('order-details-not-found')).toBeInTheDocument();
    expect(orders.getOrderById).toHaveBeenCalledTimes(1);
    expect(orders.getOrderById).toHaveBeenCalledWith(77);
  });
});
