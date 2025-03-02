import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderList } from './OrderList';
import { orders } from '../../lib/api';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderStatus } from '../../types/order';

vi.mock('../../lib/api', () => ({
  orders: {
    getUserOrders: vi.fn(),
  },
}));

describe('OrderList', () => {
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
          <OrderList />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', async () => {
    // given
    (orders.getUserOrders as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    // when
    renderWithProviders();
    
    // then
    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    // given
    (orders.getUserOrders as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Error loading orders')).toBeInTheDocument();
    });
  });

  it('renders empty state when no orders are returned', async () => {
    // given
    (orders.getUserOrders as jest.Mock).mockResolvedValueOnce({
      data: {
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 10,
        number: 0,
      },
    });
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText("You don't have any orders yet.")).toBeInTheDocument();
    });
  });

  it('renders orders list when orders are returned', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
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
          },
          {
            id: 2,
            status: 'DELIVERED' as OrderStatus,
            totalAmount: 59.97,
            createdAt: '2023-01-02T12:00:00Z',
            items: [
              {
                id: 2,
                productId: 2,
                productName: 'Another Product',
                quantity: 3,
                unitPrice: 19.99,
                totalPrice: 59.97,
              }
            ],
          },
        ],
        totalPages: 1,
        totalElements: 2,
        size: 10,
        number: 0,
      },
    };
    
    (orders.getUserOrders as jest.Mock).mockResolvedValueOnce(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Your Orders')).toBeInTheDocument();
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Order #2')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('DELIVERED')).toBeInTheDocument();
      expect(screen.getByText('Total: $39.98')).toBeInTheDocument();
      expect(screen.getByText('Total: $59.97')).toBeInTheDocument();
      expect(screen.getAllByText('View Details →').length).toBe(2);
    });
  });

  it('filters orders by status when status filter is changed', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
            items: [{ id: 1, productId: 1, quantity: 2 }],
          },
        ],
        totalPages: 1,
        totalElements: 1,
        size: 10,
        number: 0,
      },
    };
    
    (orders.getUserOrders as jest.Mock).mockResolvedValue(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(orders.getUserOrders).toHaveBeenCalledWith(0, 10, undefined);
    });
    
    // when - change filter to PENDING
    fireEvent.change(screen.getByLabelText(/filter by status/i), { target: { value: 'PENDING' } });
    
    // then
    await waitFor(() => {
      expect(orders.getUserOrders).toHaveBeenCalledWith(0, 10, 'PENDING');
    });
    
    // when - change filter back to ALL
    fireEvent.change(screen.getByLabelText(/filter by status/i), { target: { value: 'ALL' } });
    
    // then
    await waitFor(() => {
      expect(orders.getUserOrders).toHaveBeenCalledWith(0, 10, undefined);
    });
  });

  it('changes page when pagination controls are clicked', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
            items: [{ id: 1, productId: 1, quantity: 2 }],
          },
        ],
        totalPages: 3,
        totalElements: 25,
        size: 10,
        number: 0,
      },
    };
    
    (orders.getUserOrders as jest.Mock).mockResolvedValue(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(orders.getUserOrders).toHaveBeenCalledWith(0, 10, undefined);
    });
    
    // when - click on page 2
    fireEvent.click(screen.getByText('2'));
    
    // then
    await waitFor(() => {
      expect(orders.getUserOrders).toHaveBeenCalledWith(1, 10, undefined);
    });
    
    // when - click on next button
    fireEvent.click(screen.getByText('Next'));
    
    // then
    await waitFor(() => {
      expect(orders.getUserOrders).toHaveBeenCalledWith(2, 10, undefined);
    });
    
    // when - click on previous button
    fireEvent.click(screen.getByText('Previous'));
    
    // then
    await waitFor(() => {
      expect(orders.getUserOrders).toHaveBeenCalledWith(1, 10, undefined);
    });
  });

  it('disables previous button on first page', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
            items: [{ id: 1, productId: 1, quantity: 2 }],
          },
        ],
        totalPages: 3,
        totalElements: 25,
        size: 10,
        number: 0,
      },
    };
    
    (orders.getUserOrders as jest.Mock).mockResolvedValue(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });
  });

  it('disables next button on last page', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
            items: [{ id: 1, productId: 1, quantity: 2 }],
          },
        ],
        totalPages: 3,
        totalElements: 25,
        size: 10,
        number: 2, // Last page (0-indexed)
      },
    };
    
    (orders.getUserOrders as jest.Mock).mockResolvedValue(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      // First API call is with page 0
      expect(orders.getUserOrders).toHaveBeenCalledWith(0, 10, undefined);
      
      // Click on page 3 (index 2)
      fireEvent.click(screen.getByText('3'));
      
      // Now we should be on the last page
      expect(orders.getUserOrders).toHaveBeenCalledWith(2, 10, undefined);
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
      
      const previousButton = screen.getByText('Previous');
      expect(previousButton).not.toBeDisabled();
    });
  });

  it('resets to page 0 when filter changes', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
            items: [{ id: 1, productId: 1, quantity: 2 }],
          },
        ],
        totalPages: 3,
        totalElements: 25,
        size: 10,
        number: 0,
      },
    };
    
    (orders.getUserOrders as jest.Mock).mockResolvedValue(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(orders.getUserOrders).toHaveBeenCalledWith(0, 10, undefined);
    });
    
    // when - go to page 2
    fireEvent.click(screen.getByText('2'));
    
    // then
    await waitFor(() => {
      expect(orders.getUserOrders).toHaveBeenCalledWith(1, 10, undefined);
    });
    
    // when - change filter
    fireEvent.change(screen.getByLabelText(/filter by status/i), { target: { value: 'DELIVERED' } });
    
    // then - should reset to page 0
    await waitFor(() => {
      expect(orders.getUserOrders).toHaveBeenCalledWith(0, 10, 'DELIVERED');
    });
  });
}); 