import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminProductForm } from './AdminProductForm';
import { products } from '../../lib/api';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the products API
vi.mock('../../lib/api', () => ({
  products: {
    createProduct: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    updateProduct: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    getProductById: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        name: 'Test Product',
        description: 'Test description',
        price: 19.99,
        stockQuantity: 10,
        category: 'Test Category',
        imageUrl: 'https://example.com/image.jpg',
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

describe('AdminProductForm', () => {
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

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders form fields correctly in create mode', () => {
    // given
    renderWithProviders(<AdminProductForm />);

    // then
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stock quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
  });

  it('submits form with correct data in create mode', async () => {
    // given
    renderWithProviders(<AdminProductForm />);

    // when
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'New description' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '29.99' } });
    fireEvent.change(screen.getByLabelText(/stock quantity/i), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'New Category' } });
    fireEvent.change(screen.getByLabelText(/image url/i), { target: { value: 'https://example.com/new-image.jpg' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /create product/i }));

    // then
    await waitFor(() => {
      expect(products.createProduct).toHaveBeenCalledWith({
        name: 'New Product',
        description: 'New description',
        price: 29.99,
        stockQuantity: 15,
        category: 'New Category',
        imageUrl: 'https://example.com/new-image.jpg',
      });
    });
  });

  it('loads product data in edit mode', async () => {
    // given
    renderWithProviders(<AdminProductForm productId={1} />);

    // then
    await waitFor(() => {
      expect(products.getProductById).toHaveBeenCalledWith(1);
      expect(screen.getByLabelText(/name/i)).toHaveValue('Test Product');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Test description');
      expect(screen.getByLabelText(/price/i)).toHaveValue(19.99);
      expect(screen.getByLabelText(/stock quantity/i)).toHaveValue(10);
      expect(screen.getByLabelText(/category/i)).toHaveValue('Test Category');
      expect(screen.getByLabelText(/image url/i)).toHaveValue('https://example.com/image.jpg');
      expect(screen.getByRole('button', { name: /update product/i })).toBeInTheDocument();
    });
  });

  it('submits form with correct data in edit mode', async () => {
    // given
    renderWithProviders(<AdminProductForm productId={1} />);
    
    // Wait for the product data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('Test Product');
    });

    // when
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Updated Product' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '24.99' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /update product/i }));

    // then
    await waitFor(() => {
      expect(products.updateProduct).toHaveBeenCalledWith(1, {
        name: 'Updated Product',
        description: 'Test description',
        price: 24.99,
        stockQuantity: 10,
        category: 'Test Category',
        imageUrl: 'https://example.com/image.jpg',
      });
    });
  });

  it('shows validation errors for required fields', async () => {
    // given
    renderWithProviders(<AdminProductForm />);

    // when
    fireEvent.submit(screen.getByRole('button', { name: /create product/i }));

    // then
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/price is required/i)).toBeInTheDocument();
      expect(screen.getByText(/stock quantity is required/i)).toBeInTheDocument();
      expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    });
    
    expect(products.createProduct).not.toHaveBeenCalled();
  });
}); 