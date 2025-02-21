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

  test('should display streaming response chunks', async ({ page }) => {
    // given
    const chunks = [
      { model: 'gemma:2b', response: 'Hello', done: false },
      { model: 'gemma:2b', response: ' World', done: false },
      { model: 'gemma:2b', response: '!', done: true }
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
    
    // Log initial state
    const initialContent = await page.textContent('.whitespace-pre-wrap');
    console.log('Initial content:', initialContent);
    
    await page.click('button:has-text("Generate")');

    // Log content immediately after clicking
    const contentAfterClick = await page.textContent('.whitespace-pre-wrap');
    console.log('Content after click:', contentAfterClick);

    // then
    // Wait for content to start appearing
    await expect(async () => {
      const content = await page.textContent('.whitespace-pre-wrap');
      console.log('Current content:', content);
      expect(content).not.toBe('Response will appear here');
      expect(content).not.toBe('');
    }).toPass({ timeout: 5000 });

    // Wait for content to be updated
    let previousContent = '';
    await expect(async () => {
      const content = await page.textContent('.whitespace-pre-wrap');
      console.log('Current content:', content);
      expect(content).not.toBe(previousContent);
      previousContent = content ?? '';
    }).toPass({ timeout: 5000 });

    // Wait for final content
    await expect(async () => {
      const content = await page.textContent('.whitespace-pre-wrap');
      console.log('Final content:', content);
      expect(content).toBe('Hello World!');
    }).toPass({ timeout: 5000 });

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