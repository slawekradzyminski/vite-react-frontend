import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOllamaChat } from './useOllamaChat';
import { ollama } from '../lib/api';
import { useToast } from './useToast';

vi.mock('../lib/api', () => ({
  ollama: {
    chat: vi.fn(),
  },
}));

vi.mock('./useToast', () => ({
  useToast: vi.fn(),
}));

describe('useOllamaChat', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
  });

  it('initializes with default state', () => {
    // when
    const { result } = renderHook(() => useOllamaChat());

    // then
    expect(result.current.isChatting).toBe(false);
    expect(result.current.messages).toEqual([
      { role: 'system', content: 'You are a helpful AI assistant. You must use the conversation history to answer questions.' }
    ]);
    expect(result.current.model).toBe('llama3.2:1b');
  });

  it('handles empty message', async () => {
    // given
    const { result } = renderHook(() => useOllamaChat());

    // when
    await act(() => result.current.chat('  '));

    // then
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Please enter a message',
    });
    expect(ollama.chat).not.toHaveBeenCalled();
  });

  it('maintains conversation history through multiple messages', async () => {
    // given
    const mockResponse1 = new Response(
      'data: {"model":"llama3.2:1b","message":{"role":"assistant","content":"I\'m doing great"},"done":false}\n\n' +
      'data: {"model":"llama3.2:1b","message":{"role":"assistant","content":"!"},"done":true}\n\n',
      { headers: { 'Content-Type': 'text/event-stream' } }
    );

    const mockResponse2 = new Response(
      'data: {"model":"llama3.2:1b","message":{"role":"assistant","content":"Your initial question was: How are you today?"},"done":true}\n\n',
      { headers: { 'Content-Type': 'text/event-stream' } }
    );

    vi.mocked(ollama.chat)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    const { result } = renderHook(() => useOllamaChat());

    // when - first message
    await act(async () => {
      await result.current.chat('How are you today?');
    });

    // then - first message
    expect(result.current.messages).toEqual([
      { role: 'system', content: 'You are a helpful AI assistant. You must use the conversation history to answer questions.' },
      { role: 'user', content: 'How are you today?' },
      { role: 'assistant', content: 'I\'m doing great!' }
    ]);

    // when - second message
    await act(async () => {
      await result.current.chat('What was my initial question?');
    });

    // then - second message should include full history
    expect(result.current.messages).toEqual([
      { role: 'system', content: 'You are a helpful AI assistant. You must use the conversation history to answer questions.' },
      { role: 'user', content: 'How are you today?' },
      { role: 'assistant', content: 'I\'m doing great!' },
      { role: 'user', content: 'What was my initial question?' },
      { role: 'assistant', content: 'Your initial question was: How are you today?' }
    ]);

    // Verify API calls included full history
    expect(vi.mocked(ollama.chat)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(ollama.chat).mock.calls[1][0].messages).toEqual([
      { role: 'system', content: 'You are a helpful AI assistant. You must use the conversation history to answer questions.' },
      { role: 'user', content: 'How are you today?' },
      { role: 'assistant', content: 'I\'m doing great!' },
      { role: 'user', content: 'What was my initial question?' }
    ]);
  });

  it('handles streaming response correctly', async () => {
    // given
    const mockResponse = new Response(
      'data: {"model":"llama3.2:1b","message":{"role":"assistant","content":"Hello"},"done":false}\n\n' +
      'data: {"model":"llama3.2:1b","message":{"role":"assistant","content":" World"},"done":false}\n\n' +
      'data: {"model":"llama3.2:1b","message":{"role":"assistant","content":"!"},"done":true}\n\n',
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
    vi.mocked(ollama.chat).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOllamaChat());

    // when
    await act(async () => {
      await result.current.chat('Hi there');
    });

    // then
    expect(result.current.messages).toEqual([
      { role: 'system', content: 'You are a helpful AI assistant. You must use the conversation history to answer questions.' },
      { role: 'user', content: 'Hi there' },
      { role: 'assistant', content: 'Hello World!' }
    ]);
  });

  it('handles errors during chat', async () => {
    // given
    vi.mocked(ollama.chat).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useOllamaChat());

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
  });

  it('verifies conversation history is included in subsequent requests', async () => {
    // given
    const responses = [
      new Response(
        'data: {"model":"llama3.2:1b","message":{"role":"assistant","content":"First response"},"done":true}\n\n',
        { headers: { 'Content-Type': 'text/event-stream' } }
      ),
      new Response(
        'data: {"model":"llama3.2:1b","message":{"role":"assistant","content":"Second response"},"done":true}\n\n',
        { headers: { 'Content-Type': 'text/event-stream' } }
      ),
      new Response(
        'data: {"model":"llama3.2:1b","message":{"role":"assistant","content":"Third response"},"done":true}\n\n',
        { headers: { 'Content-Type': 'text/event-stream' } }
      )
    ];

    const chatSpy = vi.mocked(ollama.chat)
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2]);

    const { result } = renderHook(() => useOllamaChat());

    // when - send three messages in sequence
    await act(async () => {
      await result.current.chat('First message');
    });

    await act(async () => {
      await result.current.chat('Second message');
    });

    await act(async () => {
      await result.current.chat('Third message');
    });

    // then - verify each API call included the full history
    expect(chatSpy).toHaveBeenCalledTimes(3);
    
    // First call should have system + first user message
    expect(chatSpy.mock.calls[0][0].messages).toEqual([
      { role: 'system', content: expect.any(String) },
      { role: 'user', content: 'First message' }
    ]);

    // Second call should include previous assistant response
    expect(chatSpy.mock.calls[1][0].messages).toEqual([
      { role: 'system', content: expect.any(String) },
      { role: 'user', content: 'First message' },
      { role: 'assistant', content: 'First response' },
      { role: 'user', content: 'Second message' }
    ]);

    // Third call should include all previous messages
    expect(chatSpy.mock.calls[2][0].messages).toEqual([
      { role: 'system', content: expect.any(String) },
      { role: 'user', content: 'First message' },
      { role: 'assistant', content: 'First response' },
      { role: 'user', content: 'Second message' },
      { role: 'assistant', content: 'Second response' },
      { role: 'user', content: 'Third message' }
    ]);

    // Final messages state should include all messages
    expect(result.current.messages).toEqual([
      { role: 'system', content: expect.any(String) },
      { role: 'user', content: 'First message' },
      { role: 'assistant', content: 'First response' },
      { role: 'user', content: 'Second message' },
      { role: 'assistant', content: 'Second response' },
      { role: 'user', content: 'Third message' },
      { role: 'assistant', content: 'Third response' }
    ]);
  });
}); 