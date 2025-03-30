import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminOrdersPage } from './ordersPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the AdminOrderList component to isolate tests
vi.mock('../../components/admin/AdminOrderList', () => ({
  AdminOrderList: () => <div data-testid="admin-order-list-mock">Mocked Admin Order List</div>
}));

describe('AdminOrdersPage', () => {
  // given
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const renderAdminOrdersPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminOrdersPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders the admin orders page container', () => {
    // when
    renderAdminOrdersPage();
    
    // then
    expect(screen.getByTestId('admin-orders-page')).toBeInTheDocument();
  });

  it('renders the AdminOrderList component', () => {
    // when
    renderAdminOrdersPage();
    
    // then
    expect(screen.getByTestId('admin-order-list-mock')).toBeInTheDocument();
    expect(screen.getByText('Mocked Admin Order List')).toBeInTheDocument();
  });
}); 