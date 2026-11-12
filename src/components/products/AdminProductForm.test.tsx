import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminProductForm } from './AdminProductForm';
import { products } from '../../lib/api';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the products API
vi.mock('../../lib/api', async () => ({
  ...(await import('../../test/commerceApiMocks')).commerceApiMocks(),
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

// Mock react-router hooks
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
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
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
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
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['inventory'] });
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
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
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
      }, undefined);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['inventory'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['inventory-detail', 1] });
    });
  });

  it('sends the loaded ETag and reports a concurrent edit without losing the form', async () => {
    vi.mocked(products.getProductById).mockResolvedValueOnce({
      data: { id: 1, name: 'Test Product', description: 'Test description', price: 19.99, stockQuantity: 10, category: 'Test Category', imageUrl: 'https://example.com/image.jpg' },
      headers: { etag: '"4"' },
    } as never);
    vi.mocked(products.updateProduct).mockRejectedValueOnce(Object.assign(new Error('Precondition Failed'), {
      isAxiosError: true, response: { status: 412, data: { message: 'Product was modified by someone else; reload it and try again' } },
    }));
    renderWithProviders(<AdminProductForm productId={1} />);
    await waitFor(() => expect(screen.getByLabelText(/name/i)).toHaveValue('Test Product'));

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My edit' } });
    fireEvent.submit(screen.getByRole('button', { name: /update product/i }));

    expect(await screen.findByTestId('product-edit-conflict')).toHaveTextContent('Someone else changed this product');
    expect(vi.mocked(products.updateProduct).mock.calls[0][2]).toBe('"4"');
    expect(screen.getByLabelText(/name/i)).toHaveValue('My edit');
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

  const fillValidProduct = (description: string) => {
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: description } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '29.99' } });
    fireEvent.change(screen.getByLabelText(/stock quantity/i), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'New Category' } });
  };

  it('requires a description, as the API does', async () => {
    // given
    renderWithProviders(<AdminProductForm />);
    fillValidProduct('   ');

    // when
    fireEvent.submit(screen.getByRole('button', { name: /create product/i }));

    // then
    expect(await screen.findByTestId('product-description-error')).toHaveTextContent('Product description is required');
    expect(screen.getByLabelText(/description/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('product-description-label')).toHaveTextContent('Description*');
    expect(products.createProduct).not.toHaveBeenCalled();
  });

  it('shows the field messages the API returns next to their inputs', async () => {
    // given
    vi.mocked(products.createProduct).mockRejectedValueOnce(Object.assign(new Error('Bad Request'), {
      isAxiosError: true, response: { status: 400, data: { category: 'Category must not exceed 255 characters', unknownField: 'ignored' } },
    }));
    const onSuccess = vi.fn();
    renderWithProviders(<AdminProductForm onSuccess={onSuccess} />);
    fillValidProduct('A description');

    // when
    fireEvent.submit(screen.getByRole('button', { name: /create product/i }));

    // then
    expect(await screen.findByTestId('product-category-error')).toHaveTextContent('Category must not exceed 255 characters');
    expect(screen.queryByTestId('product-form-error')).not.toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows a request failure without field messages above the actions', async () => {
    // given
    vi.mocked(products.createProduct).mockRejectedValueOnce(Object.assign(new Error('Server Error'), {
      isAxiosError: true, response: { status: 500, data: { message: 'Internal server error' } },
    }));
    renderWithProviders(<AdminProductForm />);
    fillValidProduct('A description');

    // when
    fireEvent.submit(screen.getByRole('button', { name: /create product/i }));

    // then
    expect(await screen.findByTestId('product-form-error')).toHaveTextContent('Internal server error');
  });

  it('reports a successful save to the page', async () => {
    // given
    const onSuccess = vi.fn();
    renderWithProviders(<AdminProductForm onSuccess={onSuccess} />);
    fillValidProduct('A description');

    // when
    fireEvent.submit(screen.getByRole('button', { name: /create product/i }));

    // then
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
