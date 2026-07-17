import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { liveNextTokenProvider } from './nextTokenProviders';
import { useLiveNextToken } from './useLiveNextToken';

vi.mock('./nextTokenProviders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./nextTokenProviders')>();
  return { ...actual, liveNextTokenProvider: vi.fn() };
});

describe('useLiveNextToken', () => {
  beforeEach(() => vi.clearAllMocks());

  test('stores a successful live result', async () => {
    vi.mocked(liveNextTokenProvider).mockResolvedValue({
      kind: 'live', sourceLabel: 'Live', modelLabel: 'model', prompt: 'prompt', tokens: [],
      capturedProbabilityMass: 0.5, truncated: true,
    });
    const { result } = renderHook(() => useLiveNextToken());

    await act(() => result.current.run({ model: 'model', prompt: 'prompt', topK: 5 }));

    expect(result.current.result?.kind).toBe('live');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('keeps backend error detail visible instead of falling back silently', async () => {
    vi.mocked(liveNextTokenProvider).mockRejectedValue({
      response: { data: { message: 'This model does not expose logprobs' } },
    });
    const { result } = renderHook(() => useLiveNextToken());

    await act(() => result.current.run({ model: 'model', prompt: 'prompt', topK: 5 }));

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBe('This model does not expose logprobs');
  });
});
