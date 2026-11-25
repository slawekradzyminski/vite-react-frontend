import { QueryClient } from '@tanstack/react-query';
import { retryServerErrors } from './requestErrors';

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // React Query retries every failure three times by default, so a 404 kept a page on
        // "Loading..." for about 10 s before it showed anything. Only server and network errors
        // are worth retrying (at most three times); a 4xx or a timeout is shown at once.
        retry: retryServerErrors,
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
