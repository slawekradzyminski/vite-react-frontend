import { Page, Route } from '@playwright/test';
import { BACKEND_URL } from '../config/constants';

function createMockEventStream(chunks: any[]): string {
  return chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('');
}

export const ollamaChatMocks = {
  async mockSuccess(page: Page, onRequest?: (route: Route) => void) {
    await page.route(`${BACKEND_URL}/api/ollama/chat`, async (route) => {
      onRequest?.(route);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            message: { content: "# Heading\n\n1. Item 1\n2. Item 2", role: 'assistant' },
            done: false
          },
          {
            message: { role: 'assistant' },
            done: true
          }
        ])
      });
    });
  },

  async mockConversation(page: Page, onRequest?: (route: Route) => void) {
    let requestCount = 0;
    await page.route(`${BACKEND_URL}/api/ollama/chat`, async (route) => {
      if (requestCount === 1) {
        onRequest?.(route);
      }
      requestCount++;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            message: { content: "Love is emotion.", role: 'assistant' },
            done: false
          },
          {
            message: { role: 'assistant' },
            done: true
          }
        ])
      });
    });
  },

  async mockWithThinking(page: Page, onRequest?: (route: Route) => void) {
    await page.route(`${BACKEND_URL}/api/ollama/chat`, async (route) => {
      onRequest?.(route);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            message: { 
              content: "Based on my analysis, here's my response.",
              thinking: "Let me think about this... I need to analyze the request carefully.",
              role: 'assistant' 
            },
            done: false
          },
          {
            message: { role: 'assistant' },
            done: true
          }
        ])
      });
    });
  },

  async mockError(page: Page) {
    await page.route(`${BACKEND_URL}/api/ollama/chat`, async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'content-type': 'text/event-stream' },
        body: 'event: error\ndata: Failed to fetch stream: Internal Server Error\n\n'
      });
    });
  }
}; 