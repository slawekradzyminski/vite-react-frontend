import { Page, Route } from '@playwright/test';
import { BACKEND_URL } from '../config/constants';

function createMockEventStream(chunks: any[]): string {
  return chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('');
}

export const ollamaMocks = {
    async mockSuccess(page: Page, onRequest?: (route: Route) => void) {
        await page.route('**/api/ollama/generate', async route => {
            if (onRequest) {
                await onRequest(route);
            }

            const chunks = [
                { model: 'qwen3:0.6b', response: '# Heading\n\n', done: false },
                { model: 'qwen3:0.6b', response: '* List item 1\n* List item 2\n\n', done: false },
                { model: 'qwen3:0.6b', response: '**Bold text**\n\n`code block`', done: true }
            ];

            const response = chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('');
            await route.fulfill({
                status: 200,
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                },
                body: response
            });
        });
    },
    
    async mockError(page: Page) {
        await page.route('**/api/ollama/generate', route => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Failed to fetch stream' })
            });
        });
    }
};

export const ollamaGenerateMocks = {
  async mockSuccess(page: Page, onRequest?: (route: Route) => void) {
    await page.route(`${BACKEND_URL}/api/ollama/generate`, async (route) => {
      onRequest?.(route);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            response: "# Heading\n\n1. Item 1\n2. Item 2",
            done: false
          },
          {
            response: "",
            done: true
          }
        ])
      });
    });
  },

  async mockWithThinking(page: Page, onRequest?: (route: Route) => void) {
    await page.route(`${BACKEND_URL}/api/ollama/generate`, async (route) => {
      onRequest?.(route);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            response: "Based on my analysis, here's my response.",
            thinking: "Let me think about this... I need to analyze the request carefully.",
            done: false
          },
          {
            response: "",
            done: true
          }
        ])
      });
    });
  },

  async mockStreamingThinking(page: Page, onRequest?: (route: Route) => void) {
    await page.route(`${BACKEND_URL}/api/ollama/generate`, async (route) => {
      onRequest?.(route);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            response: "",
            thinking: "Let me think...",
            done: false
          },
          {
            response: "",
            thinking: " about this carefully...",
            done: false
          },
          {
            response: "Here's my response",
            thinking: "",
            done: false
          },
          {
            response: "",
            done: true
          }
        ])
      });
    });
  },

  async mockError(page: Page) {
    await page.route(`${BACKEND_URL}/api/ollama/generate`, async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'content-type': 'text/event-stream' },
        body: 'event: error\ndata: Failed to fetch stream: Internal Server Error\n\n'
      });
    });
  }
};

