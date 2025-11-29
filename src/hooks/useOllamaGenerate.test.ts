import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOllamaGenerate } from './useOllamaGenerate';
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

const createSseResponse = (payload: string) =>
  new Response(payload, {
    headers: { 'Content-Type': 'text/event-stream' }
  });

describe('useOllama', () => {
  const mockToast = vi.fn();
  const defaultSsePayload = 'data: {"response":"test response","done":true}\n\n';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    vi.mocked(ollama.generate).mockResolvedValue(createSseResponse(defaultSsePayload));
  });

  it('initializes with default state', () => {
    // when
    const { result } = renderHook(() => useOllamaGenerate());

    // then
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.response).toBe('');
    expect(result.current.thinking).toBe('');
    expect(result.current.model).toBe('qwen3:0.6b');
    expect(result.current.temperature).toBe(0.8);
    expect(result.current.think).toBe(false);
  });

  it('handles empty prompt', async () => {
    // given
    const { result } = renderHook(() => useOllamaGenerate());

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
      'data: {"model":"qwen3:0.6b","response":"Hello","done":false}\n\n' +
      'data: {"model":"qwen3:0.6b","response":" World","done":true}\n\n',
      {
        headers: { 'Content-Type': 'text/event-stream' }
      }
    );
    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOllamaGenerate());

    // when
    await act(async () => {
      await result.current.generate('test prompt');
    });

    // then
    expect(result.current.response).toBe('Hello World');
    expect(result.current.isGenerating).toBe(false);
    expect(ollama.generate).toHaveBeenCalledWith({
      model: 'qwen3:0.6b',
      prompt: 'test prompt',
      think: false,
      options: { temperature: 0.8 },
    });
  });

  it('handles API error', async () => {
    // given
    const error = new Error('API Error');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(ollama.generate).mockRejectedValue(error);
    const { result } = renderHook(() => useOllamaGenerate());

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
    consoleErrorSpy.mockRestore();
  });

  it('calls onError callback when provided', async () => {
    // given
    const error = new Error('API Error');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(ollama.generate).mockRejectedValue(error);
    const onError = vi.fn();

    const { result } = renderHook(() => useOllamaGenerate({ onError }));

    // when
    await act(async () => {
      await result.current.generate('test prompt');
    });

    // then
    expect(onError).toHaveBeenCalledWith(error);
    consoleErrorSpy.mockRestore();
  });

  it('handles SSE processing error', async () => {
    // given
    const mockResponse = new Response(
      'data: invalid json\n\n',
      {
        headers: { 'Content-Type': 'text/event-stream' }
      }
    );
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOllamaGenerate());

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
    consoleErrorSpy.mockRestore();
  });

  test('should initialize with default temperature of 0.8', () => {
    // when
    const { result } = renderHook(() => useOllamaGenerate());

    // then
    expect(result.current.temperature).toBe(0.8);
  });

  test('should allow temperature adjustment', () => {
    // given
    const { result } = renderHook(() => useOllamaGenerate());

    // when
    act(() => {
      result.current.setTemperature(0.3);
    });

    // then
    expect(result.current.temperature).toBe(0.3);
  });

  test('should include temperature in generate request', async () => {
    // given
    const { result } = renderHook(() => useOllamaGenerate());
    const customTemperature = 0.5;

    // when
    act(() => {
      result.current.setTemperature(customTemperature);
    });
    await act(async () => {
      await result.current.generate('test prompt');
    });

    // then
    expect(ollama.generate).toHaveBeenCalledWith({
      model: 'qwen3:0.6b',
      prompt: 'test prompt',
      think: false,
      options: { temperature: customTemperature }
    });
  });

  test('should use default temperature in generate request if not changed', async () => {
    // given
    const { result } = renderHook(() => useOllamaGenerate());

    // when
    await act(async () => {
      await result.current.generate('test prompt');
    });

    // then
    expect(ollama.generate).toHaveBeenCalledWith({
      model: 'qwen3:0.6b',
      prompt: 'test prompt',
      think: false,
      options: { temperature: 0.8 }
    });
  });

  it('processes thinking content in response', async () => {
    // given
    const mockResponse = new Response(
      'data: {"model":"qwen3:0.6b","response":"","thinking":"Let me think...","done":false}\n\n' +
      'data: {"model":"qwen3:0.6b","response":"","thinking":" about this.","done":false}\n\n' +
      'data: {"model":"qwen3:0.6b","response":"Hello","thinking":"","done":false}\n\n' +
      'data: {"model":"qwen3:0.6b","response":" World","thinking":"","done":true}\n\n',
      {
        headers: { 'Content-Type': 'text/event-stream' }
      }
    );
    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOllamaGenerate());

    // when
    await act(async () => {
      await result.current.generate('test prompt');
    });

    // then
    expect(result.current.response).toBe('Hello World');
    expect(result.current.thinking).toBe('Let me think... about this.');
    expect(result.current.isGenerating).toBe(false);
  });

  it('processes response with thinking enabled', async () => {
    // given
    const mockResponse = new Response(
      'data: {"model":"qwen3:0.6b","response":"Answer","thinking":"Reasoning","done":true}\n\n',
      {
        headers: { 'Content-Type': 'text/event-stream' }
      }
    );
    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOllamaGenerate());

    // when
    await act(() => {
      result.current.setThink(true);
    });
    await act(async () => {
      await result.current.generate('test prompt');
    });

    // then
    expect(ollama.generate).toHaveBeenCalledWith({
      model: 'qwen3:0.6b',
      prompt: 'test prompt',
      think: true,
      options: { temperature: 0.8 },
    });
    expect(result.current.response).toBe('Answer');
    expect(result.current.thinking).toBe('Reasoning');
  });
}); 
