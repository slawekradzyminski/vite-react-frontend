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

    // Mock the init endpoint
    await page.route('**/api/ollama/generate', route => {
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: 'test-generation-id' })
      });
    });

    // Mock the SSE endpoint with streaming simulation
    await page.route('**/api/ollama/generate/stream/**', route => {
      // Send all chunks in a single response, but with proper SSE formatting
      const sseChunks = chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('');
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: sseChunks
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
    // Wait for first chunk
    await expect(async () => {
      const content = await page.textContent('.whitespace-pre-wrap');
      console.log('Current content:', content);
      expect(content).toBe('Hello');
    }).toPass({ timeout: 2000 });

    // Wait for second chunk
    await expect(async () => {
      const content = await page.textContent('.whitespace-pre-wrap');
      console.log('Current content:', content);
      expect(content).toBe('Hello World');
    }).toPass({ timeout: 2000 });

    // Wait for final chunk
    await expect(async () => {
      const content = await page.textContent('.whitespace-pre-wrap');
      console.log('Final content:', content);
      expect(content).toBe('Hello World!');
    }).toPass({ timeout: 2000 });

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
    await expect(page.getByText(/failed to initialize generation/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });
});