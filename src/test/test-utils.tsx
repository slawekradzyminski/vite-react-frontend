import { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../components/ui/ToastProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export function renderWithProviders(ui: ReactNode) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          {children}
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper });
}

// Components that format money read the display currency through React Query.
export function renderWithQueryClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(ui, { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
