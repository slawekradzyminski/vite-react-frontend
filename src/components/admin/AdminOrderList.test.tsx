import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminOrderList } from './AdminOrderList';
import { orders } from '../../lib/api';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderStatus } from '../../types/order';

vi.mock('../../lib/api', () => ({
  orders: {
    getAllOrders: vi.fn(),
  },
}));

describe('AdminOrderList', () => {
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
          <AdminOrderList />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    // given
    (orders.getAllOrders as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    // when
    renderWithProviders();
    
    // then
    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    // given
    (orders.getAllOrders as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Error loading orders')).toBeInTheDocument();
    });
  });

  it('renders empty state when no orders are returned', async () => {
    // given
    const mockOrders = {
      data: {
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 10,
        number: 0,
      },
    };
    
    (orders.getAllOrders as jest.Mock).mockResolvedValueOnce(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
    });
  });

  it('renders orders list when orders are returned', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            username: 'testuser',
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
            updatedAt: '2023-01-01T12:00:00Z',
            items: [],
            shippingAddress: {
              street: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zipCode: '12345',
              country: 'Test Country',
            },
          },
          {
            id: 2,
            username: 'testuser2',
            status: 'DELIVERED' as OrderStatus,
            totalAmount: 59.97,
            createdAt: '2023-01-02T12:00:00Z',
            updatedAt: '2023-01-02T12:00:00Z',
            items: [],
            shippingAddress: {
              street: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zipCode: '12345',
              country: 'Test Country',
            },
          },
        ],
        totalPages: 1,
        totalElements: 2,
        size: 10,
        number: 0,
      },
    };
    
    (orders.getAllOrders as jest.Mock).mockResolvedValueOnce(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Manage Orders')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('testuser2')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('DELIVERED')).toBeInTheDocument();
      expect(screen.getByText('$39.98')).toBeInTheDocument();
      expect(screen.getByText('$59.97')).toBeInTheDocument();
      expect(screen.getAllByText('View Details').length).toBe(2);
    });
  });

  it('filters orders by status when status filter is changed', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            username: 'testuser',
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
            updatedAt: '2023-01-01T12:00:00Z',
            items: [],
            shippingAddress: {
              street: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zipCode: '12345',
              country: 'Test Country',
            },
          },
        ],
        totalPages: 1,
        totalElements: 1,
        size: 10,
        number: 0,
      },
    };
    
    (orders.getAllOrders as jest.Mock).mockResolvedValue(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(orders.getAllOrders).toHaveBeenCalledWith(0, 10, undefined);
    });
    
    // when - change filter to PENDING
    const statusFilter = await screen.findByLabelText(/filter by status/i);

    fireEvent.change(statusFilter, { target: { value: 'PENDING' } });
    
    // then
    await waitFor(() => {
      expect(orders.getAllOrders).toHaveBeenCalledWith(0, 10, 'PENDING');
    });
    
    // when - change filter back to ALL
    fireEvent.change(statusFilter, { target: { value: 'ALL' } });
    
    // then
    await waitFor(() => {
      expect(orders.getAllOrders).toHaveBeenCalledWith(0, 10, undefined);
    });
  });

  it('navigates to next page when next button is clicked', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            username: 'testuser',
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
            updatedAt: '2023-01-01T12:00:00Z',
            items: [],
            shippingAddress: {
              street: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zipCode: '12345',
              country: 'Test Country',
            },
          },
        ],
        totalPages: 3,
        totalElements: 25,
        size: 10,
        number: 0,
      },
    };
    
    (orders.getAllOrders as jest.Mock).mockResolvedValue(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(orders.getAllOrders).toHaveBeenCalledWith(0, 10, undefined);
    });
    
    // when - click next button
    const nextButton = await screen.findByText('Next');

    fireEvent.click(nextButton);
    
    // then
    await waitFor(() => {
      expect(orders.getAllOrders).toHaveBeenCalledWith(1, 10, undefined);
    });
  });

  it('navigates to previous page when previous button is clicked', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            username: 'testuser',
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
            updatedAt: '2023-01-01T12:00:00Z',
            items: [],
            shippingAddress: {
              street: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zipCode: '12345',
              country: 'Test Country',
            },
          },
        ],
        totalPages: 3,
        totalElements: 25,
        size: 10,
        number: 1, // Start on page 2 (index 1)
      },
    };
    
    (orders.getAllOrders as jest.Mock).mockResolvedValue(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(orders.getAllOrders).toHaveBeenCalledWith(0, 10, undefined);
    });
    
    // when - click previous button
    const previousButton = await screen.findByText('Previous');

    fireEvent.click(previousButton);
    
    // then
    await waitFor(() => {
      expect(orders.getAllOrders).toHaveBeenCalledWith(0, 10, undefined);
    });
  });

  it('disables previous button on first page', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            username: 'testuser',
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
            updatedAt: '2023-01-01T12:00:00Z',
            items: [],
            shippingAddress: {
              street: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zipCode: '12345',
              country: 'Test Country',
            },
          },
        ],
        totalPages: 3,
        totalElements: 25,
        size: 10,
        number: 0, // First page
      },
    };
    
    (orders.getAllOrders as jest.Mock).mockResolvedValueOnce(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
      expect(previousButton).toHaveClass('bg-gray-200');
    });
  });

  it('disables next button on last page', async () => {
    // given
    const mockOrders = {
      data: {
        content: [
          {
            id: 1,
            username: 'testuser',
            status: 'PENDING' as OrderStatus,
            totalAmount: 39.98,
            createdAt: '2023-01-01T12:00:00Z',
            updatedAt: '2023-01-01T12:00:00Z',
            items: [],
            shippingAddress: {
              street: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zipCode: '12345',
              country: 'Test Country',
            },
          },
        ],
        totalPages: 1, // Only one page
        totalElements: 1,
        size: 10,
        number: 0,
      },
    };
    
    (orders.getAllOrders as jest.Mock).mockResolvedValueOnce(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass('bg-gray-200');
    });
  });
}); 
