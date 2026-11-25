import { QueryClient } from '@tanstack/react-query';

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // React Query's default ('online') pauses a query while the browser reports itself offline,
        // which left pages without data and without an error: the products list showed "No products
        // found". Always sending the request turns being offline into a network error that the
        // pages render as an error state with Retry.
        networkMode: 'always',
      },
      mutations: {
        networkMode: 'always',
      },
    },
  });
}
