import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminProductFormPage } from './productFormPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the AdminProductForm component to isolate tests
vi.mock('../../components/products/AdminProductForm', () => ({
  AdminProductForm: ({ productId }: { productId?: number }) => (
    <div data-testid="admin-product-form-mock">
      Mocked Admin Product Form {productId ? `for product ${productId}` : 'for new product'}
    </div>
  )
}));

// Mock the react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn()
  };
});

import { useParams } from 'react-router-dom';

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
    (useParams as jest.Mock).mockReturnValue({ id: undefined });
    
    // when
    renderAdminProductFormPage();
    
    // then
    expect(screen.getByTestId('admin-product-form-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-product-form-title')).toHaveTextContent('Add New Product');
    expect(screen.getByTestId('admin-product-form-mock')).toHaveTextContent('for new product');
  });

  it('renders the edit product form page when ID is provided', () => {
    // given
    (useParams as jest.Mock).mockReturnValue({ id: '42' });
    
    // when
    renderAdminProductFormPage();
    
    // then
    expect(screen.getByTestId('admin-product-form-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-product-form-title')).toHaveTextContent('Edit Product');
    expect(screen.getByTestId('admin-product-form-mock')).toHaveTextContent('for product 42');
  });
}); 