import { Page } from '@playwright/test';

export const ollamaChatMocks = {
  async mockSuccess(page: Page) {
    await page.route('**/api/ollama/chat', async route => {
      const chunks = [
        {
          model: 'llama3.2:1b',
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