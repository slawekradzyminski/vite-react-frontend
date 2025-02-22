import { test, expect } from './fixtures/auth.fixture';
import { ollamaMocks } from './mocks/ollamaMocks';
import { OllamaPage } from './pages/ollama.page';

test.describe('Ollama Generate', () => {
  let ollamaPage: OllamaPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    ollamaPage = new OllamaPage(authenticatedPage.page);
  });

  test('should display streaming response chunks with markdown formatting', async ({ authenticatedPage }) => {
    // given
    await ollamaMocks.mockSuccess(authenticatedPage.page);
    await ollamaPage.goto();

    // when
    await ollamaPage.generate('Test prompt');

    // then
    await expect(ollamaPage.getMarkdownElement('h1')).toHaveText('Heading');
    await expect(ollamaPage.getMarkdownElement('ul > li')).toHaveCount(2);
    await expect(ollamaPage.getMarkdownElement('ul > li').nth(0)).toHaveText('List item 1');
    await expect(ollamaPage.getMarkdownElement('ul > li').nth(1)).toHaveText('List item 2');
    await expect(ollamaPage.getMarkdownElement('strong')).toHaveText('Bold text');
    await expect(ollamaPage.getMarkdownElement('code')).toHaveText('code block');
    await expect(ollamaPage.generateButton).toBeEnabled();
  });

  test('should handle streaming errors gracefully', async ({ authenticatedPage }) => {
    // given
    await ollamaMocks.mockError(authenticatedPage.page);
    await ollamaPage.goto();

    // when
    await ollamaPage.generate('Test prompt');

    // then
    await expect(ollamaPage.errorMessage).toBeVisible();
    await expect(ollamaPage.generateButton).toBeEnabled();
  });
});