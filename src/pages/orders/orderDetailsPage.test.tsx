import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderDetailsPage } from './orderDetailsPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContext } from '../../hooks/useToast';

// Mock the OrderDetails component to isolate tests
vi.mock('../../components/orders/OrderDetails', () => ({
  OrderDetails: () => <div data-testid="order-details-mock">Mocked Order Details</div>
}));

describe('OrderDetailsPage', () => {
  // given
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const mockToast = vi.fn();
  
  const renderOrderDetailsPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ToastContext.Provider value={{ toast: mockToast }}>
          <BrowserRouter>
            <OrderDetailsPage />
          </BrowserRouter>
        </ToastContext.Provider>
      </QueryClientProvider>
    );
  };

  it('renders the order details page container', () => {
    // when
    renderOrderDetailsPage();
    
    // then
    expect(screen.getByTestId('order-details-page-container')).toBeInTheDocument();
  });

  it('renders the OrderDetails component', () => {
    // when
    renderOrderDetailsPage();
    
    // then
    expect(screen.getByTestId('order-details-mock')).toBeInTheDocument();
    expect(screen.getByText('Mocked Order Details')).toBeInTheDocument();
  });
}); 