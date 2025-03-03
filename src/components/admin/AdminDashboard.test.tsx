import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminDashboard } from './AdminDashboard';
import { orders, products } from '../../lib/api';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderStatus } from '../../types/order';

vi.mock('../../lib/api', () => ({
  orders: {
    getAllOrders: vi.fn(),
  },
  products: {
    getAllProducts: vi.fn(),
  },
}));

describe('AdminDashboard', () => {
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
          <AdminDashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders loading state when both queries are loading', () => {
    // given
    (orders.getAllOrders as jest.Mock).mockReturnValue(new Promise(() => {}));
    (products.getAllProducts as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    // when
    renderWithProviders();
    
    // then
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });

  it('renders dashboard with data when queries succeed', async () => {
    // given
    const mockProducts = {
      data: [
        {
          id: 1,
          name: 'Test Product',
          description: 'Test description',
          price: 19.99,
          stockQuantity: 10,
          category: 'Test Category',
          imageUrl: 'test.jpg',
          createdAt: '2023-01-01T12:00:00Z',
          updatedAt: '2023-01-01T12:00:00Z',
        },
        {
          id: 2,
          name: 'Low Stock Product',
          description: 'Low stock description',
          price: 29.99,
          stockQuantity: 2,
          category: 'Test Category',
          imageUrl: 'test2.jpg',
          createdAt: '2023-01-01T12:00:00Z',
          updatedAt: '2023-01-01T12:00:00Z',
        },
      ],
    };

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
        size: 50,
        number: 0,
      },
    };
    
    (products.getAllProducts as jest.Mock).mockResolvedValueOnce(mockProducts);
    (orders.getAllOrders as jest.Mock).mockResolvedValueOnce(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      
      // Check for metrics with more specific selectors
      const twoElements = screen.getAllByText('2', { selector: 'p.text-3xl.font-bold' });
      expect(twoElements.length).toBe(2); // Total products, Total orders
      
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('Pending Orders')).toBeInTheDocument();
      expect(screen.getByText('1', { selector: 'p.text-3xl.font-bold' })).toBeInTheDocument(); // Pending orders
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$99.95')).toBeInTheDocument(); // Total revenue
      
      // Check for recent orders
      expect(screen.getByText('Recent Orders')).toBeInTheDocument();
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Order #2')).toBeInTheDocument();
      
      // Check for low stock products
      expect(screen.getByText('Low Stock Products')).toBeInTheDocument();
      expect(screen.getByText('Low Stock Product')).toBeInTheDocument();
      expect(screen.getByText('2 in stock')).toBeInTheDocument();
    });
  });

  it('renders dashboard with empty data', async () => {
    // given
    const mockProducts = {
      data: [],
    };

    const mockOrders = {
      data: {
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 50,
        number: 0,
      },
    };
    
    (products.getAllProducts as jest.Mock).mockResolvedValueOnce(mockProducts);
    (orders.getAllOrders as jest.Mock).mockResolvedValueOnce(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      
      // Check for metrics with more specific selectors
      const zeroElements = screen.getAllByText('0', { selector: 'p.text-3xl.font-bold' });
      expect(zeroElements.length).toBe(3); // Total products, Total orders, Pending orders
      
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument(); // Total revenue
      
      // Check for empty states
      expect(screen.getByText('Recent Orders')).toBeInTheDocument();
      expect(screen.getByText('No orders found')).toBeInTheDocument();
      expect(screen.getByText('Low Stock Products')).toBeInTheDocument();
      expect(screen.getByText('No low stock products')).toBeInTheDocument();
    });
  });

  it('renders dashboard with partial data (products loading)', async () => {
    // given
    (products.getAllProducts as jest.Mock).mockReturnValue(new Promise(() => {}));
    
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
        size: 50,
        number: 0,
      },
    };
    
    (orders.getAllOrders as jest.Mock).mockResolvedValueOnce(mockOrders);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      
      // Check for metrics with more specific selectors
      const oneElements = screen.getAllByText('1', { selector: 'p.text-3xl.font-bold' });
      expect(oneElements.length).toBe(2); // Total orders, Pending orders
      
      const zeroElement = screen.getByText('0', { selector: 'p.text-3xl.font-bold' });
      expect(zeroElement).toBeInTheDocument(); // Total products
    });
  });
}); 