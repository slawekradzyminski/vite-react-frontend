import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { refetchAfterWrite } from './queryRefresh';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function watch(client: QueryClient, queryKey: string[], queryFn: () => Promise<string[]>) {
  const observer = new QueryObserver(client, { queryKey, queryFn, retry: false });
  const unsubscribe = observer.subscribe(() => undefined);
  return { observer, unsubscribe };
}

describe('refetchAfterWrite', () => {
  it('starts a new request when the first load is still in flight', async () => {
    // given: the first list request started before the write and answers with the old list
    const client = new QueryClient();
    const firstLoad = deferred<string[]>();
    const queryFn = vi.fn()
      .mockImplementationOnce(() => firstLoad.promise)
      .mockResolvedValueOnce(['PL', 'XU']);
    const { observer, unsubscribe } = watch(client, ['rates'], queryFn);

    // when
    const refreshed = refetchAfterWrite(client, ['rates']);
    firstLoad.resolve(['PL']);
    await refreshed;

    // then
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(observer.getCurrentResult().data).toEqual(['PL', 'XU']);
    unsubscribe();
  });

  it('refetches every given key that already holds data', async () => {
    // given
    const client = new QueryClient();
    const rates = vi.fn().mockResolvedValueOnce(['PL']).mockResolvedValueOnce(['PL', 'XU']);
    const currencies = vi.fn().mockResolvedValueOnce(['USD']).mockResolvedValueOnce(['USD', 'EUR']);
    const first = watch(client, ['rates'], rates);
    const second = watch(client, ['currencies'], currencies);
    await vi.waitFor(() => expect(second.observer.getCurrentResult().data).toEqual(['USD']));
    await vi.waitFor(() => expect(first.observer.getCurrentResult().data).toEqual(['PL']));

    // when
    await refetchAfterWrite(client, ['rates'], ['currencies']);

    // then
    expect(first.observer.getCurrentResult().data).toEqual(['PL', 'XU']);
    expect(second.observer.getCurrentResult().data).toEqual(['USD', 'EUR']);
    first.unsubscribe();
    second.unsubscribe();
  });

  it('leaves other in-flight queries running', async () => {
    // given: an unrelated query is still loading
    const client = new QueryClient();
    const otherLoad = deferred<string[]>();
    const other = vi.fn().mockImplementationOnce(() => otherLoad.promise);
    const rates = vi.fn().mockResolvedValue(['PL']);
    const watchedOther = watch(client, ['currencies'], other);
    const watchedRates = watch(client, ['rates'], rates);

    // when
    await refetchAfterWrite(client, ['rates']);
    otherLoad.resolve(['USD']);

    // then
    await vi.waitFor(() => expect(watchedOther.observer.getCurrentResult().data).toEqual(['USD']));
    expect(other).toHaveBeenCalledTimes(1);
    watchedOther.unsubscribe();
    watchedRates.unsubscribe();
  });
});
