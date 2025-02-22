import { Page } from "@playwright/test";

export const ollamaMocks = {
    mockSuccess: async (page: Page) => {
        const chunks = [
            { model: 'gemma:2b', response: '# Heading\n\n', done: false },
            { model: 'gemma:2b', response: '- List item 1\n', done: false },
            { model: 'gemma:2b', response: '- List item 2\n\n', done: false },
            { model: 'gemma:2b', response: '**Bold text**\n\n', done: false },
            { model: 'gemma:2b', response: '`code block`', done: true }
          ];
      
        await page.route('**/api/ollama/generate', async route => {
            const allChunks = chunks.map(chunk => {
              const lines = JSON.stringify(chunk, null, 2)
                .split('\n')
                .map(line => `data:${line}`);
              return lines.join('\n') + '\n\n';
            }).join('');
      
            route.fulfill({
              status: 200,
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              },
              body: allChunks
            });
        });
    },
    
    mockError: async (page: Page) => {
        await page.route('**/api/ollama/generate', route => {
            route.fulfill({
              status: 500,
              body: 'Internal Server Error'
            });
        });
    }
};

