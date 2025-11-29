import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './ProtectedRoute';
import { auth } from '../lib/api';
import { Role } from '../types/auth';
import type { AxiosResponse } from 'axios';
import type { User } from '../types/auth';

vi.mock('../lib/api', () => ({
  auth: {
    me: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const TestComponent = () => <div>Protected Content</div>;

const renderWithProviders = (
  children: React.ReactNode,
  initialEntries: string[] = ['/protected']
) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div data-testid="home-page">Home</div>} />
          <Route path="/protected" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProtectedRoute', () => {
const fulfillAuth = (
  roles: Array<Role | { authority: string }>
): AxiosResponse<User> => ({
  data: {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: roles as unknown as User['roles'],
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // given
  it('redirects to login when no token is present', () => {
    // when
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    // then
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  // given
  it('renders children when token is present and API call succeeds', async () => {
    // when
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue(fulfillAuth([Role.CLIENT]));

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    // then
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  // given
  it('redirects to login when API call fails', async () => {
    // when
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockRejectedValue(new Error('Unauthorized'));

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    // then
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('shows loading indicator while fetching user data', async () => {
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockReturnValue(new Promise(() => {}));

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(await screen.findByTestId('protected-route-loading')).toBeInTheDocument();
  });

  it('renders children when requiredRole matches string role', async () => {
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue(fulfillAuth([Role.ADMIN]));

    renderWithProviders(
      <ProtectedRoute requiredRole="ADMIN" data-testid="custom-protected">
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-protected')).toBeInTheDocument();
    });
  });

  it('renders children when roles are provided as authority objects', async () => {
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue(
      fulfillAuth([{ authority: 'ROLE_MANAGER' }])
    );

    renderWithProviders(
      <ProtectedRoute requiredRole="MANAGER">
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('redirects to home when requiredRole is missing on user', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue(fulfillAuth([Role.CLIENT]));

    renderWithProviders(
      <ProtectedRoute requiredRole="ADMIN">
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });
}); 
