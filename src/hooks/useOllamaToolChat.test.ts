import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOllamaToolChat } from './useOllamaToolChat';
import { ollama } from '../lib/api';
import { useToast } from './useToast';
import * as sse from '../lib/sse';
import type { OllamaToolDefinition } from '../types/ollama';

vi.mock('../lib/api', () => ({
  ollama: {
    chatWithTools: vi.fn(),
    getToolDefinitions: vi.fn().mockResolvedValue([]),
  },
  prompts: {
    tool: {
      get: vi.fn().mockResolvedValue({ data: { toolSystemPrompt: '' } }),
      update: vi.fn(),
    },
  },
}));

vi.mock('./useToast', () => ({
  useToast: vi.fn(),
}));

describe('useOllamaToolChat', () => {
  const mockToast = vi.fn();
  const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));
  const renderToolChatHook = async (options?: Parameters<typeof useOllamaToolChat>[0]) => {
    const hookResult = renderHook(() => useOllamaToolChat(options));
    await act(async () => {
      await flushPromises();
    });
    return hookResult;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
  });

  it('initializes with default state', async () => {
    // when
    const { result } = await renderToolChatHook();

    // then
    expect(result.current.isChatting).toBe(false);
    expect(result.current.messages).toEqual([
      { role: 'system', content: expect.stringContaining('tool-calling shopping assistant') }
    ]);
    expect(result.current.model).toBe('qwen3:4b-instruct');
    expect(result.current.temperature).toBe(0.4);
  });

  it('sanitizes null fields from tool definitions', async () => {
    const dirtyDefinitions: OllamaToolDefinition[] = [
      {
        type: 'function',
        function: {
          name: 'list_products',
          description: 'desc',
          parameters: {
            type: 'object',
            properties: {
              offset: {
                type: 'integer',
                description: 'offset',
                enum: null as unknown as string[],
              },
            },
            required: null as unknown as string[],
            oneOf: null as unknown as Array<{ required: string[] }>,
          },
        },
      },
    ];

    vi.mocked(ollama.getToolDefinitions).mockResolvedValueOnce(dirtyDefinitions);

    const { result } = await renderToolChatHook();

    expect(result.current.toolDefinitions[0].function.parameters).not.toHaveProperty('required');
    expect(
      result.current.toolDefinitions[0].function.parameters.properties?.offset
    ).not.toHaveProperty('enum');
  });

  it('handles empty message', async () => {
    // given
    const { result } = await renderToolChatHook();

    // when
    await act(() => result.current.chat('  '));

    // then
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Please enter a question.',
    });
    expect(ollama.chatWithTools).not.toHaveBeenCalled();
  });

  it('shows messages in correct order for multi-iteration tool flow', async () => {
    // given
    const sseSpy = vi.spyOn(sse, 'processSSEResponse').mockImplementation(async (_resp, handlers) => {
      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [{ function: { name: 'list_products', arguments: { category: 'electronics' } } }],
        },
        done: false,
        created_at: '',
      });

      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: {
          role: 'tool',
          tool_name: 'list_products',
          content: '{"products":[{"id":1,"name":"iPhone 13 Pro"}]}',
        },
        done: false,
        created_at: '',
      });

      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [{ function: { name: 'get_product_snapshot', arguments: { name: 'iPhone 13 Pro' } } }],
        },
        done: false,
        created_at: '',
      });

      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: {
          role: 'tool',
          tool_name: 'get_product_snapshot',
          content: '{"id":1,"name":"iPhone 13 Pro","price":999.99}',
        },
        done: false,
        created_at: '',
      });

      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: {
          role: 'assistant',
          content: 'We have one iPhone: **iPhone 13 Pro** at $999.99.',
        },
        done: true,
        created_at: '',
      });

      handlers.onComplete?.();
    });

    const mockResponse = new Response('', { headers: { 'Content-Type': 'text/event-stream' } });
    vi.mocked(ollama.chatWithTools).mockResolvedValue(mockResponse);

    const { result } = await renderToolChatHook();

    // when
    await act(async () => {
      await result.current.chat('What iPhones do we have?');
    });

    // then
    const messages = result.current.messages;
    expect(messages.length).toBe(7);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('What iPhones do we have?');
    expect(messages[2].role).toBe('assistant');
    expect(messages[2].tool_calls?.[0].function.name).toBe('list_products');
    expect(messages[3].role).toBe('tool');
    expect(messages[3].tool_name).toBe('list_products');
    expect(messages[4].role).toBe('assistant');
    expect(messages[4].tool_calls?.[0].function.name).toBe('get_product_snapshot');
    expect(messages[5].role).toBe('tool');
    expect(messages[5].tool_name).toBe('get_product_snapshot');
    expect(messages[6].role).toBe('assistant');
    expect(messages[6].content).toContain('iPhone 13 Pro');
    expect(messages[6].tool_calls).toBeUndefined();

    sseSpy.mockRestore();
  });

  it('does not create empty assistant messages', async () => {
    // given
    const sseSpy = vi.spyOn(sse, 'processSSEResponse').mockImplementation(async (_resp, handlers) => {
      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [{ function: { name: 'list_products', arguments: {} } }],
        },
        done: false,
        created_at: '',
      });

      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: {
          role: 'tool',
          tool_name: 'list_products',
          content: '{"products":[]}',
        },
        done: false,
        created_at: '',
      });

      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: {
          role: 'assistant',
          content: 'No products found.',
        },
        done: true,
        created_at: '',
      });

      handlers.onComplete?.();
    });

    const mockResponse = new Response('', { headers: { 'Content-Type': 'text/event-stream' } });
    vi.mocked(ollama.chatWithTools).mockResolvedValue(mockResponse);

    const { result } = await renderToolChatHook();

    // when
    await act(async () => {
      await result.current.chat('List products');
    });

    // then
    const assistantMessages = result.current.messages.filter(m => m.role === 'assistant');
    assistantMessages.forEach(msg => {
      const hasContent = msg.content && msg.content.trim().length > 0;
      const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
      expect(hasContent || hasToolCalls).toBe(true);
    });

    sseSpy.mockRestore();
  });

  it('handles streaming content tokens correctly', async () => {
    // given
    const sseSpy = vi.spyOn(sse, 'processSSEResponse').mockImplementation(async (_resp, handlers) => {
      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: { role: 'assistant', content: 'Hello' },
        done: false,
        created_at: '',
      });

      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: { role: 'assistant', content: ' World' },
        done: false,
        created_at: '',
      });

      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: { role: 'assistant', content: '!' },
        done: true,
        created_at: '',
      });

      handlers.onComplete?.();
    });

    const mockResponse = new Response('', { headers: { 'Content-Type': 'text/event-stream' } });
    vi.mocked(ollama.chatWithTools).mockResolvedValue(mockResponse);

    const { result } = await renderToolChatHook();

    // when
    await act(async () => {
      await result.current.chat('Say hello');
    });

    // then
    const assistantMsg = result.current.messages.find(m => m.role === 'assistant' && !m.tool_calls);
    expect(assistantMsg?.content).toBe('Hello World!');

    sseSpy.mockRestore();
  });

  it('handles tool call with intermediate content', async () => {
    // given
    const sseSpy = vi.spyOn(sse, 'processSSEResponse').mockImplementation(async (_resp, handlers) => {
      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: {
          role: 'assistant',
          content: 'I will fetch the product details.',
          tool_calls: [{ function: { name: 'get_product_snapshot', arguments: { name: 'iPhone' } } }],
        },
        done: false,
        created_at: '',
      });

      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: {
          role: 'tool',
          tool_name: 'get_product_snapshot',
          content: '{"id":1,"name":"iPhone"}',
        },
        done: false,
        created_at: '',
      });

      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: { role: 'assistant', content: 'Here is the iPhone.' },
        done: true,
        created_at: '',
      });

      handlers.onComplete?.();
    });

    const mockResponse = new Response('', { headers: { 'Content-Type': 'text/event-stream' } });
    vi.mocked(ollama.chatWithTools).mockResolvedValue(mockResponse);

    const { result } = await renderToolChatHook();

    // when
    await act(async () => {
      await result.current.chat('Get iPhone');
    });

    // then
    const toolCallMsg = result.current.messages.find(m => m.tool_calls?.length);
    expect(toolCallMsg?.content).toBe('I will fetch the product details.');

    sseSpy.mockRestore();
  });

  it('handles errors during chat', async () => {
    // given
    vi.mocked(ollama.chatWithTools).mockRejectedValue(new Error('Network error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = await renderToolChatHook();

    // when
    await act(async () => {
      await result.current.chat('Hello');
    });

    // then
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Network error',
    });
    expect(result.current.isChatting).toBe(false);
    consoleErrorSpy.mockRestore();
  });

  it('calls options.onError when SSE processing fails', async () => {
    // given
    const sseSpy = vi.spyOn(sse, 'processSSEResponse').mockImplementation(async (_resp, handlers) => {
      handlers.onError?.(new Error('SSE failure'));
      handlers.onComplete?.();
    });
    const onError = vi.fn();
    const mockResponse = new Response('', { headers: { 'Content-Type': 'text/event-stream' } });
    vi.mocked(ollama.chatWithTools).mockResolvedValue(mockResponse);

    const { result } = await renderToolChatHook({ onError });

    // when
    await act(async () => {
      await result.current.chat('trigger error');
    });

    // then
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Failed to process tool response',
    });
    sseSpy.mockRestore();
  });

  it('prevents concurrent chat requests when one is already running', async () => {
    // given
    let resolveStream: (() => void) | null = null;
    const pendingStream = new Promise<void>((resolve) => {
      resolveStream = resolve;
    });
    const sseSpy = vi.spyOn(sse, 'processSSEResponse').mockImplementation(async (_resp, handlers) => {
      await pendingStream;
      handlers.onComplete?.();
    });
    const mockResponse = new Response('', { headers: { 'Content-Type': 'text/event-stream' } });
    vi.mocked(ollama.chatWithTools).mockResolvedValue(mockResponse);
    const { result } = await renderToolChatHook();

    // when
    await act(async () => {
      result.current.chat('first message');
    });

    await act(async () => {
      await result.current.chat('second message');
    });

    // then
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Wait for the current response to finish.',
    });

    await act(async () => {
      resolveStream?.();
      await flushPromises();
    });
    sseSpy.mockRestore();
  });

  it('handles done without message', async () => {
    // given
    const sseSpy = vi.spyOn(sse, 'processSSEResponse').mockImplementation(async (_resp, handlers) => {
      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: { role: 'assistant', content: 'Hello' },
        done: false,
        created_at: '',
      });

      handlers.onMessage({
        model: 'qwen3:4b-instruct',
        message: undefined as never,
        done: true,
        created_at: '',
      });

      handlers.onComplete?.();
    });

    const mockResponse = new Response('', { headers: { 'Content-Type': 'text/event-stream' } });
    vi.mocked(ollama.chatWithTools).mockResolvedValue(mockResponse);

    const { result } = await renderToolChatHook();

    // when
    await act(async () => {
      await result.current.chat('Say hello');
    });

    // then
    expect(result.current.isChatting).toBe(false);
    const assistantMsg = result.current.messages.find(m => m.role === 'assistant');
    expect(assistantMsg?.content).toBe('Hello');

    sseSpy.mockRestore();
  });
});
