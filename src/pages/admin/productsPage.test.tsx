import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminProductsPage } from './productsPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the AdminProductList component to isolate tests
vi.mock('../../components/admin/AdminProductList', () => ({
  AdminProductList: () => <div data-testid="admin-product-list-mock">Mocked Admin Product List</div>
}));

describe('AdminProductsPage', () => {
  // given
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const renderAdminProductsPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminProductsPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders the admin products page container', () => {
    // when
    renderAdminProductsPage();
    
    // then
    expect(screen.getByTestId('admin-products-page')).toBeInTheDocument();
  });

  it('renders the AdminProductList component', () => {
    // when
    renderAdminProductsPage();
    
    // then
    expect(screen.getByTestId('admin-product-list-mock')).toBeInTheDocument();
    expect(screen.getByText('Mocked Admin Product List')).toBeInTheDocument();
  });
}); 