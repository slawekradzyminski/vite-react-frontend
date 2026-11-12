import { describe, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AdminProductFormPage } from './productFormPage';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the AdminProductForm component to isolate tests
vi.mock('../../components/products/AdminProductForm', () => ({
  AdminProductForm: ({ productId, onSuccess }: { productId?: number; onSuccess?: () => void }) => (
    <div data-testid="admin-product-form-mock">
      Mocked Admin Product Form {productId ? `for product ${productId}` : 'for new product'}
      <button type="button" onClick={onSuccess} data-testid="admin-product-form-mock-save">Save</button>
    </div>
  )
}));

const mockNavigate = vi.fn();
const mockToast = vi.fn();
vi.mock('../../hooks/useToast', () => ({ useToast: () => ({ toast: mockToast }) }));

// Mock the react-router hooks
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: () => mockNavigate,
  };
});

import { useParams } from 'react-router';

describe('AdminProductFormPage', () => {
  // given
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const renderAdminProductFormPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminProductFormPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders the new product form page when no ID is provided', () => {
    // given
    (useParams as Mock).mockReturnValue({ id: undefined });
    
    // when
    renderAdminProductFormPage();
    
    // then
    expect(screen.getByTestId('admin-product-form-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-product-form-title')).toHaveTextContent('Add New Product');
    expect(screen.getByTestId('admin-product-form-mock')).toHaveTextContent('for new product');
  });

  it('renders the edit product form page when ID is provided', () => {
    // given
    (useParams as Mock).mockReturnValue({ id: '42' });
    
    // when
    renderAdminProductFormPage();
    
    // then
    expect(screen.getByTestId('admin-product-form-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-product-form-title')).toHaveTextContent('Edit Product');
    expect(screen.getByTestId('admin-product-form-mock')).toHaveTextContent('for product 42');
  });

  it.each([
    [undefined, 'Product created', 'The product is now in the catalogue.'],
    ['42', 'Product updated', 'Your changes are saved.'],
  ])('confirms a saved product (id %s) and returns to the product list', (id, title, description) => {
    // given
    (useParams as Mock).mockReturnValue({ id });
    renderAdminProductFormPage();

    // when
    fireEvent.click(screen.getByTestId('admin-product-form-mock-save'));

    // then
    expect(mockToast).toHaveBeenCalledWith({ variant: 'success', title, description });
    expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
  });
});
