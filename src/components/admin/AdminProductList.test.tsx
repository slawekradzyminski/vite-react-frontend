import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminProductList } from './AdminProductList';
import { products } from '../../lib/api';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../lib/api', () => ({
  products: {
    getAllProducts: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

describe('AdminProductList', () => {
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
    // Mock window.confirm to always return true
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminProductList />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    // given
    (products.getAllProducts as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    // when
    renderWithProviders();
    
    // then
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    // given
    (products.getAllProducts as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Error loading products')).toBeInTheDocument();
    });
  });

  it('renders empty state when no products are returned', async () => {
    // given
    const mockProducts = {
      data: [],
    };
    
    (products.getAllProducts as jest.Mock).mockResolvedValueOnce(mockProducts);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument();
      expect(screen.getByText('Add Your First Product')).toBeInTheDocument();
    });
  });

  it('renders products list when products are returned', async () => {
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
          name: 'Another Product',
          description: 'Another description',
          price: 29.99,
          stockQuantity: 5,
          category: 'Another Category',
          imageUrl: 'test2.jpg',
          createdAt: '2023-01-02T12:00:00Z',
          updatedAt: '2023-01-02T12:00:00Z',
        },
      ],
    };
    
    (products.getAllProducts as jest.Mock).mockResolvedValueOnce(mockProducts);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Manage Products')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Another Product')).toBeInTheDocument();
      expect(screen.getByText('$19.99')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // Stock quantity
      expect(screen.getByText('5')).toBeInTheDocument(); // Stock quantity
      expect(screen.getByText('Test Category')).toBeInTheDocument();
      expect(screen.getByText('Another Category')).toBeInTheDocument();
      expect(screen.getAllByText('Edit').length).toBe(2);
      expect(screen.getAllByText('Delete').length).toBe(2);
    });
  });

  it('deletes a product when delete button is clicked', async () => {
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
      ],
    };
    
    (products.getAllProducts as jest.Mock).mockResolvedValue(mockProducts);
    (products.deleteProduct as jest.Mock).mockResolvedValueOnce({});
    
    // Mock the invalidateQueries method
    queryClient.invalidateQueries = vi.fn();
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    // when - click delete button
    fireEvent.click(screen.getByText('Delete'));
    
    // then
    await waitFor(() => {
      expect(products.deleteProduct).toHaveBeenCalledWith(1);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['products'] });
    });
  });

  it('shows deleting state when delete is in progress', async () => {
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
      ],
    };
    
    (products.getAllProducts as jest.Mock).mockResolvedValue(mockProducts);
    // Create a promise that won't resolve immediately
    const deletePromise = new Promise((resolve) => {
      setTimeout(() => resolve({}), 100);
    });
    (products.deleteProduct as jest.Mock).mockReturnValueOnce(deletePromise);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    // when - click delete button
    fireEvent.click(screen.getByText('Delete'));
    
    // then
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    
    // wait for deletion to complete
    await waitFor(() => {
      expect(products.deleteProduct).toHaveBeenCalledWith(1);
    });
  });

  it('does not delete when confirmation is cancelled', async () => {
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
      ],
    };
    
    (products.getAllProducts as jest.Mock).mockResolvedValue(mockProducts);
    // Override the confirm mock to return false
    (window.confirm as jest.Mock).mockReturnValueOnce(false);
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    // when - click delete button
    fireEvent.click(screen.getByText('Delete'));
    
    // then
    expect(products.deleteProduct).not.toHaveBeenCalled();
  });

  it('handles delete error gracefully', async () => {
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
      ],
    };
    
    (products.getAllProducts as jest.Mock).mockResolvedValue(mockProducts);
    (products.deleteProduct as jest.Mock).mockRejectedValueOnce(new Error('Failed to delete'));
    
    // Mock console.error to prevent test output pollution
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    // when
    renderWithProviders();
    
    // then
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    // when - click delete button
    fireEvent.click(screen.getByText('Delete'));
    
    // then
    await waitFor(() => {
      expect(products.deleteProduct).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete product. Please try again.');
    });
    
    // Cleanup
    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });
}); 