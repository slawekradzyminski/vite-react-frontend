# Implementation Plan for Single-Prompt Ollama Stream Integration

This plan focuses on a **single prompt** submission and a **single output** area that displays streamed data chunk-by-chunk from your `/generate` endpoint. We'll also introduce relevant TypeScript types to ensure a type-safe flow.

## 1. Create a New Page and Route

### 1.1 Folder and Page Creation
- Create a new file in `src/pages/ollama-generate/index.tsx` (or a similar name like `OllamaGeneratePage.tsx`)
- This new page handles:
  - Input for a single prompt (e.g., text area or input)
  - A "Generate" button
  - A read-only output area that displays incoming streaming chunks from the server

### 1.2 Routing
Add a route for the Ollama generate page in `src/AppRoutes.tsx`:

```tsx
<Route
  path="/ollama-generate"
  element={
    <ProtectedRoute>
      <OllamaGeneratePage />
    </ProtectedRoute>
  }
/>
```

*Note: If you need role-based access, do it in `ProtectedRoute` or in the backend.*

## 2. Define Types

Add or extend your types in `src/types/ollama.ts`:

```typescript
/** Request body for the Ollama streaming endpoint */
export interface GenerateRequestDto {
  model: string;
  prompt: string;
  options?: {
    temperature?: number;
    // add more if needed
  };
}

/** Shape of each chunk from the server's SSE or streaming response */
export interface GenerateResponseDto {
  model: string;
  response: string;
  done: boolean;
  context: number[] | null;
  created_at: string;
  total_duration: number | null;
}

/** Raw SSE event, each `data:` line contains JSON */
export interface OllamaChunkEvent {
  data: {
    model: string;
    response: string;
    done: boolean;
    context?: number[] | null;
    created_at: string;
    total_duration?: number | null;
  };
}
```

## 3. Design the Single-Prompt UI

### Basic Layout
- A text input or textarea labeled "Prompt"
- A "Generate" button that triggers the fetch request to `/generate`
- A read-only area below that displays the streaming response as it arrives

### Component Structure
`OllamaGeneratePage.tsx`:
- `prompt` state: typed as string
- `response` state: typed as string (this will accumulate chunks)
- A function `handleGenerate()` that calls the streaming fetch logic
- Render the input field, button, and a text area or `<div>` to show the final streamed text

## 4. Streaming Logic

Using fetch + ReadableStream:

```typescript
import React, { useState } from 'react';
import { GenerateRequestDto, OllamaChunkEvent } from '../../types/ollama';

export function OllamaGeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setResponse(''); // Clear previous response

    try {
      // Construct the request body (typed as GenerateRequestDto)
      const requestBody: GenerateRequestDto = {
        model: 'gemma:2b',
        prompt,
        options: { temperature: 0 }, // Adjust if needed
      };

      // Make the fetch call (replace with your actual URL if different)
      const res = await fetch('http://localhost:4001/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to fetch stream');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          // Convert chunk to text
          const chunkText = decoder.decode(value, { stream: true });

          // The chunk may contain multiple lines, each prefixed with "data:..."
          // We'll split on newlines that start with "data:"
          const dataLines = chunkText.split('\n').filter(line => line.startsWith('data:'));

          dataLines.forEach((line) => {
            // Strip "data:" prefix and parse as JSON
            const jsonText = line.replace('data:', '').trim();
            let chunkData: OllamaChunkEvent;
            try {
              chunkData = JSON.parse(jsonText);
            } catch {
              return; // or handle parse error
            }

            // Add this chunk's response text to the display
            setResponse(prev => prev + chunkData.data.response);

            // If done = true in chunk, we can finalize or break out
            if (chunkData.data.done) {
              done = true;
              // We can forcibly close the stream if needed:
              reader.cancel();
            }
          });
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      // Could show a toast error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Single Prompt to Ollama</h1>

      <label htmlFor="prompt" className="block font-medium mb-2">
        Prompt
      </label>
      <textarea
        id="prompt"
        className="w-full border rounded p-2"
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>

      <div className="mt-4">
        <label className="block font-medium mb-2">Response</label>
        <div className="w-full min-h-[100px] border rounded p-2 whitespace-pre-wrap">
          {response}
        </div>
      </div>
    </div>
  );
}
```

### Key Points
- We parse each `data:` line into JSON and append the response field to our response state
- If `done` is true, we cancel the reader

## 5. Add a Navigation Link

In `src/components/layout/Navigation.tsx` (or whichever file you have for site navigation):

```tsx
{user?.data && (
  <Link
    to="/ollama-generate"
    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
  >
    LLM Generate
  </Link>
)}
```

## 6. Tests

### 6.1 React Testing Library (Unit Tests)

Create test file: `src/pages/ollama-generate/index.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OllamaGeneratePage } from './index'; // adjust path
import { vi } from 'vitest';

describe('OllamaGeneratePage', () => {
  it('handles streaming chunks correctly', async () => {
    // given
    vi.spyOn(global, 'fetch').mockImplementationOnce(() => {
      // Mock a ReadableStream response
      const readableStream = new ReadableStream({
        start(controller) {
          // Simulate chunk1
          controller.enqueue(new TextEncoder().encode(
            `data: {"data":{"model":"gemma:2b","response":"Hello","done":false}}\n`
          ));
          // Simulate chunk2 (done)
          controller.enqueue(new TextEncoder().encode(
            `data: {"data":{"model":"gemma:2b","response":" World","done":true}}\n`
          ));
          controller.close();
        },
      });

      return Promise.resolve({
        ok: true,
        body: readableStream,
      } as Response);
    });

    // when
    render(<OllamaGeneratePage />);
    await userEvent.type(screen.getByLabelText(/prompt/i), '2+2=');
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    // then
    await waitFor(() => {
      expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    });
  });
});
```

### 6.2 Playwright (E2E Tests)

Create file: `e2e/ollamaGenerate.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ollama Generate', () => {
  test('should stream response chunks', async ({ page }) => {
    // given
    await page.goto('/login');
    // (login steps if your site is protected)
    
    // when
    await page.goto('/ollama-generate');
    await page.fill('textarea#prompt', '2+2=');
    await page.click('button:has-text("Generate")');

    // then - wait for some partial response
    await expect(page.locator('div').filter({ hasText: '4' })).toBeVisible({ timeout: 10000 });
    // Additional checks for final text if needed
  });
});
```

## 7. Verification and Deployment

### Local Testing
1. Run your dev server with `npm run dev`
2. Make sure the backend is running (`docker compose up -d` or however you start it)
3. Check the streaming endpoint at `POST http://localhost:4001/generate`

### Run Tests
1. Unit tests: `npm test`
2. E2E tests: `npm run test:e2e:ai`
3. Fix any issues until all pass

### Build and Deploy
1. Build with `npm run build` and serve with `npm run preview` or in Docker
2. The new page `/ollama-generate` is part of your final build

## 8. Summary

- A single text input for the user prompt
- A single output area that updates live with chunked data from your Ollama proxied endpoint
- Added TypeScript interfaces (`GenerateRequestDto`, `GenerateResponseDto`, and `OllamaChunkEvent`) to keep the integration type-safe
- Included test coverage:
  - 1 React Testing Library test for chunk streaming
  - 1 Playwright E2E test for the end-to-end flow

This plan ensures your site can handle real-time streaming from the `/generate` endpoint in a simple, "chatgpt-like" but single-turn fashion, letting users see the chunked output as it arrives.