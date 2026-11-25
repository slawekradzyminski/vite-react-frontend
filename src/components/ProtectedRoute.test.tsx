import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './ProtectedRoute';
import { auth } from '../lib/api';
import { Role } from '../types/auth';
import { AxiosError, type AxiosResponse } from 'axios';
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

const httpError = (status: number) =>
  new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosResponse);

const TestComponent = () => <div>Protected Content</div>;

const LoginProbe = () => {
  const location = useLocation();
  return (
    <div>
      <p>Login Page</p>
      <p data-testid="login-search">{location.search}</p>
    </div>
  );
};

const renderWithProviders = (
  children: React.ReactNode,
  initialEntries: string[] = ['/protected']
) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route path="/" element={<div data-testid="home-page">Home</div>} />
          <Route path="/protected" element={children} />
          <Route path="/products/:id" element={children} />
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
    expect(auth.me).not.toHaveBeenCalled();
  });

  it('keeps the requested deep link as returnTo when redirecting to login', () => {
    // when
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      ['/products/7?ref=share']
    );

    // then
    expect(screen.getByTestId('login-search')).toHaveTextContent(`?returnTo=${encodeURIComponent('/products/7?ref=share')}`);
  });

  it('redirects from the home page to login without a returnTo parameter', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/login" element={<LoginProbe />} />
            <Route path="/" element={<ProtectedRoute><TestComponent /></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.getByTestId('login-search')).toBeEmptyDOMElement();
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
  it('redirects to login when the backend rejects the session with 401', async () => {
    // when
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockRejectedValue(httpError(401));

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

  it.each([
    ['a 503', () => httpError(503)],
    ['a network error', () => new AxiosError('Network Error', 'ERR_NETWORK')],
    ['a timeout', () => new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED')],
  ])('keeps the session and offers a retry when the user check fails with %s', async (_label, makeError) => {
    // given
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('refreshToken', 'fake-refresh');
    vi.mocked(auth.me).mockRejectedValueOnce(makeError());

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    // then
    expect(await screen.findByTestId('protected-route-error-message')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(localStorage.getItem('refreshToken')).toBe('fake-refresh');

    expect(screen.getByTestId('protected-route-retry')).toHaveTextContent('Retry');
    expect(screen.getByTestId('protected-route-retry')).toBeEnabled();

    // when the backend recovers
    vi.mocked(auth.me).mockResolvedValue(fulfillAuth([Role.CLIENT]));
    fireEvent.click(screen.getByTestId('protected-route-retry'));

    // then
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
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

  it('renders children when the user holds any of several required roles', async () => {
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue(fulfillAuth([Role.WAREHOUSE]));

    renderWithProviders(
      <ProtectedRoute requiredRole={['WAREHOUSE', 'ADMIN']}>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to home when the user holds none of several required roles', async () => {
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue(fulfillAuth([Role.CLIENT]));

    renderWithProviders(
      <ProtectedRoute requiredRole={['WAREHOUSE', 'ADMIN']}>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(await screen.findByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
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
