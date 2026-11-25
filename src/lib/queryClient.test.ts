import { describe, expect, it } from 'vitest';
import { onlineManager } from '@tanstack/react-query';
import { createAppQueryClient } from './queryClient';

describe('createAppQueryClient', () => {
  it('sends queries and mutations even while the browser reports itself offline', () => {
    const defaults = createAppQueryClient().getDefaultOptions();

    expect(defaults.queries?.networkMode).toBe('always');
    expect(defaults.mutations?.networkMode).toBe('always');
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
