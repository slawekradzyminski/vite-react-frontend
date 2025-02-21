interface SSEProcessor<T> {
  onMessage: (data: T) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export async function processSSEResponse<T>(
  response: Response,
  processor: SSEProcessor<T>
): Promise<void> {
  if (!response.body) {
    throw new Error('Response has no body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let done = false;

  try {
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;

      if (value) {
        const chunkText = decoder.decode(value, { stream: true });
        buffer += chunkText;

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const eventBlock of events) {
          const jsonString = eventBlock
            .split('\n')
            .map(line => line.replace(/^data:/, '').trim())
            .join('')
            .trim();

          if (!jsonString) continue;

          try {
            const data = JSON.parse(jsonString) as T;
            processor.onMessage(data);
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to parse SSE JSON');
            console.error('SSE parsing error:', error, jsonString);
            processor.onError?.(error);
          }
        }
      }
    }

    if (buffer.trim()) {
      const jsonString = buffer
        .split('\n')
        .map(line => line.replace(/^data:/, '').trim())
        .join('')
        .trim();

      if (jsonString) {
        try {
          const data = JSON.parse(jsonString) as T;
          processor.onMessage(data);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to parse final SSE chunk');
          console.debug('Final chunk parsing error:', error);
          processor.onError?.(error);
        }
      }
    }

    processor.onComplete?.();
  } catch (err) {
    const error = err instanceof Error ? err : new Error('SSE processing error');
    processor.onError?.(error);
    throw error;
  } finally {
    reader.cancel();
  }
} 