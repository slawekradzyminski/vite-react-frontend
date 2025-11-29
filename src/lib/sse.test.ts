import { describe, it, expect, vi } from 'vitest';
import { processSSEResponse } from './sse';

const encoder = new TextEncoder();

const createProcessor = () => ({
  onMessage: vi.fn(),
  onError: vi.fn(),
  onComplete: vi.fn(),
});

describe('processSSEResponse', () => {
  it('processes single SSE message correctly', async () => {
    const mockResponse = new Response(
      'data: {"response":"Hello","done":false}\n\n',
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
    const processor = createProcessor();

    await processSSEResponse(mockResponse, processor);

    expect(processor.onMessage).toHaveBeenCalledWith({ response: 'Hello', done: false });
    expect(processor.onError).not.toHaveBeenCalled();
    expect(processor.onComplete).toHaveBeenCalled();
  });

  it('processes multiple SSE messages correctly', async () => {
    const mockResponse = new Response(
      'data: {"response":"Hello","done":false}\n\n' +
      'data: {"response":" World","done":true}\n\n',
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
    const processor = createProcessor();

    await processSSEResponse(mockResponse, processor);

    expect(processor.onMessage).toHaveBeenCalledTimes(2);
    expect(processor.onMessage).toHaveBeenNthCalledWith(1, { response: 'Hello', done: false });
    expect(processor.onMessage).toHaveBeenNthCalledWith(2, { response: ' World', done: true });
    expect(processor.onError).not.toHaveBeenCalled();
    expect(processor.onComplete).toHaveBeenCalled();
  });

  it('handles invalid JSON in SSE message', async () => {
    const mockResponse = new Response('data: invalid json\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    });
    const processor = createProcessor();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await processSSEResponse(mockResponse, processor);

    expect(processor.onMessage).not.toHaveBeenCalled();
    expect(processor.onError).toHaveBeenCalledWith(expect.any(Error));
    expect(processor.onComplete).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('processes trailing buffer when stream ends without delimiter', async () => {
    const reader = {
      read: vi.fn().mockResolvedValueOnce({
        value: encoder.encode('data: {"response":"Final"}\n'),
        done: true,
      }),
      cancel: vi.fn(),
    };
    const response = { body: { getReader: () => reader } } as unknown as Response;
    const processor = createProcessor();

    await processSSEResponse(response, processor);

    expect(processor.onMessage).toHaveBeenCalledWith({ response: 'Final' });
    expect(reader.cancel).toHaveBeenCalled();
    expect(processor.onComplete).toHaveBeenCalled();
  });

  it('surfaces final chunk parsing errors', async () => {
    const reader = {
      read: vi.fn().mockResolvedValueOnce({
        value: encoder.encode('data: invalid-json'),
        done: true,
      }),
      cancel: vi.fn(),
    };
    const response = { body: { getReader: () => reader } } as unknown as Response;
    const processor = createProcessor();
    const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    await processSSEResponse(response, processor);

    expect(processor.onError).toHaveBeenCalledWith(expect.any(Error));
    expect(consoleDebugSpy).toHaveBeenCalled();
    consoleDebugSpy.mockRestore();
  });

  it('handles response with no body', async () => {
    const mockResponse = new Response(null);
    Object.defineProperty(mockResponse, 'body', { value: null });
    const processor = createProcessor();

    await expect(processSSEResponse(mockResponse, processor)).rejects.toThrow('Response has no body');

    expect(processor.onMessage).not.toHaveBeenCalled();
    expect(processor.onComplete).not.toHaveBeenCalled();
  });

  it('propagates reader errors and calls onError', async () => {
    const readerError = new Error('Stream failed');
    const reader = {
      read: vi.fn().mockRejectedValue(readerError),
      cancel: vi.fn(),
    };
    const response = { body: { getReader: () => reader } } as unknown as Response;
    const processor = createProcessor();

    await expect(processSSEResponse(response, processor)).rejects.toThrow('Stream failed');
    expect(processor.onError).toHaveBeenCalledWith(readerError);
    expect(reader.cancel).toHaveBeenCalled();
  });
});
