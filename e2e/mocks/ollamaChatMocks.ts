import { Page, Route } from '@playwright/test';

export const ollamaChatMocks = {
  async mockSuccess(page: Page, onRequest?: (route: Route) => void) {
    await page.route('**/api/ollama/chat', async route => {
      if (onRequest) {
        onRequest(route);
      }

      const chunks = [
        {
          model: 'qwen3:0.6b',
          createdAt: new Date().toISOString(),
          message: {
            role: 'assistant',
            content: '# Heading\n\n* List item 1\n* List item 2\n\n**Bold text**\n\n`code block`'
          },
          done: true
        }
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

  async mockConversation(page: Page, onRequest?: (route: Route) => void) {
    await page.route('**/api/ollama/chat', async route => {
      if (onRequest) {
        onRequest(route);
      }

      const firstResponse = {
        model: 'qwen3:0.6b',
        createdAt: new Date().toISOString(),
        message: {
          role: 'assistant',
          content: 'Love is emotion.'
        },
        done: true
      };

      const secondResponse = {
        model: 'qwen3:0.6b',
        createdAt: new Date().toISOString(),
        message: {
          role: 'assistant',
          content: 'Let me elaborate on the concept of love...'
        },
        done: true
      };

      // Choose response based on the request content
      const request = JSON.parse(route.request().postData() || '{}');
      const isSecondMessage = request.messages?.some(m => m.content.includes('go on'));
      const response = `data: ${JSON.stringify(isSecondMessage ? secondResponse : firstResponse)}\n\n`;

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
    await page.route('**/api/ollama/chat', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to fetch stream' })
      });
    });
  }
}; 