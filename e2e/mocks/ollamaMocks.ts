import { Page, Route } from '@playwright/test';

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

