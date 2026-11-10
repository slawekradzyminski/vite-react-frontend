import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../components/ui/ToastProvider';
import { LocationProbe } from './LocationProbe';

export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

/**
 * Renders with a fresh QueryClient (no cache shared between tests) inside a MemoryRouter.
 * `path` is the route pattern for `ui`; the current pathname is exposed as `test-location`.
 */
export function renderWithRoute(ui: ReactElement, { route = '/', path = '*' }: { route?: string; path?: string } = {}) {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>{children}</ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  const result = render(
    <>
      <Routes>
        <Route path={path} element={ui} />
        {path !== '*' && <Route path="*" element={null} />}
      </Routes>
      <LocationProbe />
    </>,
    { wrapper: Wrapper },
  );
  return { ...result, queryClient };
}
