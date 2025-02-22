import { test, expect } from './fixtures/auth.fixture';
import { ollamaMocks } from './mocks/ollamaMocks';

test.describe('Ollama Generate', () => {

  test('should display streaming response chunks with markdown formatting', async ({ authenticatedPage }) => {
    // given
    const page = authenticatedPage.page;
    await ollamaMocks.mockSuccess(page);
    await page.goto('/ollama-generate');

    // when
    await page.fill('textarea#prompt', 'Test prompt');
    await page.click('button:has-text("Generate")');

    // then
    const responseArea = page.locator('.prose');
    await expect(responseArea.locator('h1')).toHaveText('Heading');
    await expect(responseArea.locator('ul > li')).toHaveCount(2);
    await expect(responseArea.locator('ul > li').nth(0)).toHaveText('List item 1');
    await expect(responseArea.locator('ul > li').nth(1)).toHaveText('List item 2');
    await expect(responseArea.locator('strong')).toHaveText('Bold text');
    await expect(responseArea.locator('code')).toHaveText('code block');

    await expect(page.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });

  test('should handle streaming errors gracefully', async ({ authenticatedPage }) => {
    // given
    const page = authenticatedPage.page;
    await ollamaMocks.mockError(page);
    await page.goto('/ollama-generate');

    // when
    await page.fill('textarea#prompt', 'Test prompt');
    await page.click('button:has-text("Generate")');

    // then
    await expect(page.getByTestId('toast-description')).toHaveText(/failed to fetch stream/i);
    await expect(page.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });
});