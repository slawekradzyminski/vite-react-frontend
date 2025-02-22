import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOllama } from './useOllama';
import { ollama } from '../lib/api';
import { useToast } from './useToast';

vi.mock('../lib/api', () => ({
  ollama: {
    generate: vi.fn(),
  },
}));

vi.mock('./useToast', () => ({
  useToast: vi.fn(),
}));

describe('useOllama', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
  });

  it('initializes with default state', () => {
    // when
    const { result } = renderHook(() => useOllama());

    // then
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.response).toBe('');
  });

  it('handles empty prompt', async () => {
    // given
    const { result } = renderHook(() => useOllama());

    // when
    await act(() => result.current.generate('  '));

    // then
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Please enter a prompt',
    });
    expect(ollama.generate).not.toHaveBeenCalled();
  });

  it('processes successful response', async () => {
    // given
    const mockResponse = new Response(
      'data: {"model":"llama3.2:1b","response":"Hello","done":false}\n\n' +
      'data: {"model":"llama3.2:1b","response":" World","done":true}\n\n',
      {
        headers: { 'Content-Type': 'text/event-stream' }
      }
    );
    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOllama());

    // when
    await act(async () => {
      await result.current.generate('test prompt');
    });

    // then
    expect(result.current.response).toBe('Hello World');
    expect(result.current.isGenerating).toBe(false);
    expect(ollama.generate).toHaveBeenCalledWith({
      model: 'llama3.2:1b',
      prompt: 'test prompt',
      options: { temperature: 0 },
    });
  });

  it('handles API error', async () => {
    // given
    const error = new Error('API Error');
    vi.mocked(ollama.generate).mockRejectedValue(error);
    const { result } = renderHook(() => useOllama());

    // when
    await act(async () => {
      await result.current.generate('test prompt');
    });

    // then
    expect(result.current.isGenerating).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'API Error',
    });
  });

  it('calls onError callback when provided', async () => {
    // given
    const error = new Error('API Error');
    vi.mocked(ollama.generate).mockRejectedValue(error);
    const onError = vi.fn();

    const { result } = renderHook(() => useOllama({ onError }));

    // when
    await act(async () => {
      await result.current.generate('test prompt');
    });

    // then
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('handles SSE processing error', async () => {
    // given
    const mockResponse = new Response(
      'data: invalid json\n\n',
      {
        headers: { 'Content-Type': 'text/event-stream' }
      }
    );
    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOllama());

    // when
    await act(async () => {
      await result.current.generate('test prompt');
    });

    // then
    expect(result.current.isGenerating).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Failed to process response',
    });
  });
}); 