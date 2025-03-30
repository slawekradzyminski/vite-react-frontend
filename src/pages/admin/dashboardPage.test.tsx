import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminDashboardPage } from './dashboardPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the AdminDashboard component to isolate tests
vi.mock('../../components/admin/AdminDashboard', () => ({
  AdminDashboard: () => <div data-testid="admin-dashboard-mock">Mocked Admin Dashboard</div>
}));

describe('AdminDashboardPage', () => {
  // given
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const renderAdminDashboardPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminDashboardPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders the admin dashboard page container', () => {
    // when
    renderAdminDashboardPage();
    
    // then
    expect(screen.getByTestId('admin-dashboard-page')).toBeInTheDocument();
  });

  it('renders the AdminDashboard component', () => {
    // when
    renderAdminDashboardPage();
    
    // then
    expect(screen.getByTestId('admin-dashboard-mock')).toBeInTheDocument();
    expect(screen.getByText('Mocked Admin Dashboard')).toBeInTheDocument();
  });
}); 