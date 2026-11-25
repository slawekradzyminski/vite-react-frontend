import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RedirectIfAuthenticated } from './RedirectIfAuthenticated';
import { auth } from '../lib/api';

vi.mock('../lib/api', () => ({
  auth: {
    me: vi.fn(),
  },
}));

const httpError = (status: number) =>
  new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosResponse);

const renderAt = (entry: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/login" element={<RedirectIfAuthenticated><div>Login form</div></RedirectIfAuthenticated>} />
          <Route path="/" element={<div>Home</div>} />
          <Route path="/products/:id" element={<div>Product page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('RedirectIfAuthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows the form when there is no session', () => {
    // when
    renderAt('/login');

    // then
    expect(screen.getByText('Login form')).toBeInTheDocument();
    expect(auth.me).not.toHaveBeenCalled();
  });

  it('redirects a signed-in user home and keeps the session', async () => {
    // given
    localStorage.setItem('token', 'valid-token');
    localStorage.setItem('refreshToken', 'valid-refresh');
    vi.mocked(auth.me).mockResolvedValue({ data: { username: 'client' } } as never);

    // when
    renderAt('/login');

    // then
    expect(await screen.findByText('Home')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('valid-token');
    expect(localStorage.getItem('refreshToken')).toBe('valid-refresh');
  });

  it('honours a same-origin returnTo for a signed-in user', async () => {
    // given
    localStorage.setItem('token', 'valid-token');
    vi.mocked(auth.me).mockResolvedValue({ data: { username: 'client' } } as never);

    // when
    renderAt(`/login?returnTo=${encodeURIComponent('/products/3')}`);

    // then
    expect(await screen.findByText('Product page')).toBeInTheDocument();
  });

  it('drops a rejected token and shows the form instead of looping', async () => {
    // given
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('refreshToken', 'expired-refresh');
    localStorage.setItem('clientSessionId', 'expired-user-session-01');
    vi.mocked(auth.me).mockRejectedValue(httpError(401));

    // when
    renderAt('/login');

    // then
    expect(await screen.findByText('Login form')).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem('token')).toBeNull());
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('clientSessionId')).not.toBe('expired-user-session-01');
  });

  it('shows a loading state instead of the form while the session is checked', () => {
    // given
    localStorage.setItem('token', 'pending-token');
    vi.mocked(auth.me).mockReturnValue(new Promise(() => {}) as never);

    // when
    renderAt('/login');

    // then
    expect(screen.getByTestId('auth-redirect-loading')).toBeInTheDocument();
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
  });

  it.each(['//evil.example/phish', 'https://evil.example/phish'])('never redirects a signed-in user off-site via returnTo=%s', async (returnTo) => {
    // given
    localStorage.setItem('token', 'valid-token');
    vi.mocked(auth.me).mockResolvedValue({ data: { username: 'client' } } as never);

    // when
    renderAt(`/login?returnTo=${encodeURIComponent(returnTo)}`);

    // then
    expect(await screen.findByText('Home')).toBeInTheDocument();
  });

  it.each([
    ['a 503', () => httpError(503)],
    ['a network error', () => new AxiosError('Network Error', 'ERR_NETWORK')],
  ])('keeps the tokens and offers a retry when the session check fails with %s', async (_label, makeError) => {
    // given
    localStorage.setItem('token', 'valid-token');
    localStorage.setItem('refreshToken', 'valid-refresh');
    vi.mocked(auth.me).mockRejectedValueOnce(makeError());

    // when
    renderAt('/login');

    // then
    expect(await screen.findByTestId('auth-redirect-error')).toBeInTheDocument();
    expect(screen.getByText('Login form')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('valid-token');
    expect(localStorage.getItem('refreshToken')).toBe('valid-refresh');

    // when the backend recovers
    vi.mocked(auth.me).mockResolvedValue({ data: { username: 'client' } } as never);
    fireEvent.click(screen.getByTestId('auth-redirect-retry'));

    // then
    expect(await screen.findByText('Home')).toBeInTheDocument();
  });
});
