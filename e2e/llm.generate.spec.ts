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
    await ollamaPage.openGenerateTab();

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

  test('should initialize with default model and allow model change', async ({ authenticatedPage }) => {
    // given
    await ollamaMocks.mockSuccess(authenticatedPage.page);
    await ollamaPage.goto();
    await ollamaPage.openGenerateTab();
    await expect(ollamaPage.modelInput).toHaveValue('llama3.2:1b');

    // when
    await ollamaPage.generate('Test prompt', 'mistral:7b');

    // then
    await expect(ollamaPage.modelInput).toHaveValue('mistral:7b');
  });

  test('should handle streaming errors gracefully', async ({ authenticatedPage }) => {
    // given
    await ollamaMocks.mockError(authenticatedPage.page);
    await ollamaPage.goto();
    await ollamaPage.openGenerateTab();
    // when
    await ollamaPage.generate('Test prompt');

    // then
    await expect(ollamaPage.errorMessage).toBeVisible();
    await expect(ollamaPage.generateButton).toBeEnabled();
  });

  test('should initialize with default temperature and allow adjustment', async ({ authenticatedPage }) => {
    // given
    let requestBody: any;
    await ollamaMocks.mockSuccess(authenticatedPage.page, async (route) => {
      requestBody = JSON.parse(route.request().postData() || '{}');
    });
    await ollamaPage.goto();
    await ollamaPage.openGenerateTab();

    // when
    await expect(ollamaPage.temperatureSlider).toHaveValue('0.8');
    await ollamaPage.setTemperature(0.3);
    await ollamaPage.generate('Test prompt');

    // then
    expect(requestBody.options.temperature).toBe(0.3);
  });
});