import { describe, it, expect, vi } from 'vitest';
import { processSSEResponse } from './sse';

describe('processSSEResponse', () => {

  it('processes single SSE message correctly', async () => {
    // given
    const mockResponse = new Response(
      'data: {"response":"Hello","done":false}\n\n',
      {
        headers: { 'Content-Type': 'text/event-stream' }
      }
    );
    const processor = {
      onMessage: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
    };

    // when
    await processSSEResponse(mockResponse, processor);

    // then
    expect(processor.onMessage).toHaveBeenCalledWith({ response: 'Hello', done: false });
    expect(processor.onError).not.toHaveBeenCalled();
    expect(processor.onComplete).toHaveBeenCalled();
  });

  it('processes multiple SSE messages correctly', async () => {
    // given
    const mockResponse = new Response(
      'data: {"response":"Hello","done":false}\n\n' +
      'data: {"response":" World","done":true}\n\n',
      {
        headers: { 'Content-Type': 'text/event-stream' }
      }
    );
    const processor = {
      onMessage: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
    };

    // when
    await processSSEResponse(mockResponse, processor);

    // then
    expect(processor.onMessage).toHaveBeenCalledTimes(2);
    expect(processor.onMessage).toHaveBeenNthCalledWith(1, { response: 'Hello', done: false });
    expect(processor.onMessage).toHaveBeenNthCalledWith(2, { response: ' World', done: true });
    expect(processor.onError).not.toHaveBeenCalled();
    expect(processor.onComplete).toHaveBeenCalled();
  });

  it('handles invalid JSON in SSE message', async () => {
    // given
    const mockResponse = new Response(
      'data: invalid json\n\n',
      {
        headers: { 'Content-Type': 'text/event-stream' }
      }
    );
    const processor = {
      onMessage: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
    };

    // when
    await processSSEResponse(mockResponse, processor);

    // then
    expect(processor.onMessage).not.toHaveBeenCalled();
    expect(processor.onError).toHaveBeenCalledWith(expect.any(Error));
    expect(processor.onComplete).toHaveBeenCalled();
  });

  it('handles response with no body', async () => {
    // given
    const mockResponse = new Response(null);
    Object.defineProperty(mockResponse, 'body', { value: null });

    const processor = {
      onMessage: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
    };

    // when
    await expect(processSSEResponse(mockResponse, processor)).rejects.toThrow('Response has no body');

    // then
    expect(processor.onMessage).not.toHaveBeenCalled();
    expect(processor.onComplete).not.toHaveBeenCalled();
  });
}); 