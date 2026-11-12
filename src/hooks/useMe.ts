import { useQuery } from '@tanstack/react-query';
import { auth } from '../lib/api';

export const ME_QUERY_KEY = ['me'] as const;
// The route guard, the header and the page all read the signed-in user. Without a stale time
// each observer that mounts after the first response refetches it (two /users/me per sign-in).
// Profile changes invalidate the key, and logout clears the cache.
export const ME_STALE_TIME_MS = 60_000;

export function useMe({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => auth.me(),
    retry: false,
    staleTime: ME_STALE_TIME_MS,
    enabled,
  });
}
