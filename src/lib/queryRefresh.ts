import type { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Refetches queries after a write so the result includes that write.
 *
 * `invalidateQueries` alone is not enough while a query's first load is still in flight: TanStack Query
 * only cancels an in-flight fetch for queries that already hold data, so a query without data joins the
 * fetch that started before the write and keeps its stale response. Cancelling first forces a new request.
 */
export async function refetchAfterWrite(queryClient: QueryClient, ...queryKeys: QueryKey[]): Promise<void> {
  await Promise.all(queryKeys.map(async (queryKey) => {
    await queryClient.cancelQueries({ queryKey });
    await queryClient.invalidateQueries({ queryKey });
  }));
}
