import { test, expect } from '@playwright/test';
import { getRandomUser } from './generators/userGenerator';
import { registerUser } from './http/postSignUp';
import { LoginPage } from './pages/login.page';

test.describe('Ollama Generate', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Setup login
    loginPage = new LoginPage(page);
    const user = getRandomUser();
    await registerUser(user);
    await loginPage.goto();
    await loginPage.attemptLogin({
      username: user.username,
      password: user.password,
    });
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should display streaming response chunks with markdown formatting', async ({ page }) => {
    // given
    const chunks = [
      { model: 'gemma:2b', response: '# Heading\n\n', done: false },
      { model: 'gemma:2b', response: '- List item 1\n', done: false },
      { model: 'gemma:2b', response: '- List item 2\n\n', done: false },
      { model: 'gemma:2b', response: '**Bold text**\n\n', done: false },
      { model: 'gemma:2b', response: '`code block`', done: true }
    ];

    // Debug: Log all network requests and responses
    page.on('request', request => {
      if (request.url().includes('/api/ollama/generate')) {
        console.log('Request body:', request.postData());
      }
    });

    // Mock the generate endpoint with streaming simulation
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

    // when
    await page.goto('/ollama-generate');
    await page.fill('textarea#prompt', 'Test prompt');
    await page.click('button:has-text("Generate")');

    // then
    // Wait for markdown elements to be rendered in the response area
    const responseArea = page.locator('.prose');
    await expect(responseArea.locator('h1')).toHaveText('Heading');
    await expect(responseArea.locator('ul > li')).toHaveCount(2);
    await expect(responseArea.locator('ul > li').nth(0)).toHaveText('List item 1');
    await expect(responseArea.locator('ul > li').nth(1)).toHaveText('List item 2');
    await expect(responseArea.locator('strong')).toHaveText('Bold text');
    await expect(responseArea.locator('code')).toHaveText('code block');

    // Verify button state
    await expect(page.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });

  test('should handle streaming errors gracefully', async ({ page }) => {
    // given
    await page.route('**/api/ollama/generate', route => {
      route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      });
    });

    // when
    await page.goto('/ollama-generate');
    await page.fill('textarea#prompt', 'Test prompt');
    await page.click('button:has-text("Generate")');

    // then
    await expect(page.getByText(/failed to fetch stream/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });
});