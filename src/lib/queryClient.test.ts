import { describe, expect, it } from 'vitest';
import { onlineManager } from '@tanstack/react-query';
import { AxiosError, type AxiosResponse } from 'axios';
import { createAppQueryClient } from './queryClient';

describe('createAppQueryClient', () => {
  it('sends queries and mutations even while the browser reports itself offline', () => {
    const defaults = createAppQueryClient().getDefaultOptions();

    expect(defaults.queries?.networkMode).toBe('always');
    expect(defaults.mutations?.networkMode).toBe('always');
  });

  it('does not retry a 4xx or a timeout, and retries server and network errors at most three times', () => {
    const retry = createAppQueryClient().getDefaultOptions().queries?.retry as (failureCount: number, error: unknown) => boolean;
    const httpError = (status: number) =>
      new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosResponse);

    expect(retry(0, httpError(404))).toBe(false);
    expect(retry(0, httpError(403))).toBe(false);
    expect(retry(0, new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED'))).toBe(false);
    expect(retry(0, httpError(503))).toBe(true);
    expect(retry(2, new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(true);
    expect(retry(3, httpError(500))).toBe(false);
  });

  it('shows a 404 after a single request', async () => {
    const client = createAppQueryClient();
    let calls = 0;
    const notFound = new AxiosError('Request failed with status code 404', 'ERR_BAD_REQUEST', undefined, undefined, { status: 404 } as AxiosResponse);

    await expect(client.fetchQuery({ queryKey: ['missing'], queryFn: () => { calls += 1; return Promise.reject(notFound); } })).rejects.toBe(notFound);
    expect(calls).toBe(1);
  });

  it('turns an offline request into an error instead of a paused query without data', async () => {
    const client = createAppQueryClient();
    onlineManager.setOnline(false);
    try {
      await expect(client.fetchQuery({
        queryKey: ['offline-probe'],
        queryFn: () => Promise.reject(new Error('Network Error')),
        retry: false,
      })).rejects.toThrow('Network Error');
    } finally {
      onlineManager.setOnline(true);
    }
  });
});
