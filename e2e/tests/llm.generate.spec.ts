import { test, expect } from '../fixtures/auth.fixture';
import { ollamaMocks } from '../mocks/ollamaMocks';
import { GeneratePage } from '../pages/generate.page';

test.describe('Ollama Generate', () => {
  let generatePage: GeneratePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    generatePage = new GeneratePage(authenticatedPage.page);
  });

  test('should display streaming response chunks with markdown formatting', async ({ authenticatedPage }) => {
    // given
    await ollamaMocks.mockSuccess(authenticatedPage.page);
    await generatePage.goto();
    await generatePage.openGenerateTab();

    // when
    await generatePage.generate('Test prompt');

    // then
    await expect(generatePage.getMarkdownElement('h1')).toHaveText('Heading');
    await expect(generatePage.getMarkdownElement('ul > li')).toHaveCount(2);
    await expect(generatePage.getMarkdownElement('ul > li').nth(0)).toHaveText('List item 1');
    await expect(generatePage.getMarkdownElement('ul > li').nth(1)).toHaveText('List item 2');
    await expect(generatePage.getMarkdownElement('strong')).toHaveText('Bold text');
    await expect(generatePage.getMarkdownElement('code')).toHaveText('code block');
    await expect(generatePage.generateButton).toBeEnabled();
  });

  test('should initialize with default model and allow model change', async ({ authenticatedPage }) => {
    // given
    await ollamaMocks.mockSuccess(authenticatedPage.page);
    await generatePage.goto();
    await generatePage.openGenerateTab();
    await expect(generatePage.modelInput).toHaveValue('llama3.2:1b');

    // when
    await generatePage.generate('Test prompt', 'mistral:7b');

    // then
    await expect(generatePage.modelInput).toHaveValue('mistral:7b');
  });

  test('should handle streaming errors gracefully', async ({ authenticatedPage }) => {
    // given
    await ollamaMocks.mockError(authenticatedPage.page);
    await generatePage.goto();
    await generatePage.openGenerateTab();

    // when
    await generatePage.generate('Test prompt');

    // then
    await expect(generatePage.errorMessage).toBeVisible();
    await expect(generatePage.generateButton).toBeEnabled();
  });

  test('should initialize with default temperature and allow adjustment', async ({ authenticatedPage }) => {
    // given
    let requestBody: any;
    await ollamaMocks.mockSuccess(authenticatedPage.page, async (route) => {
      requestBody = JSON.parse(route.request().postData() || '{}');
    });
    await generatePage.goto();
    await generatePage.openGenerateTab();

    // when
    await expect(generatePage.temperatureSlider).toHaveValue('0.8');
    await generatePage.setTemperature(0.3);
    await generatePage.generate('Test prompt');

    // then
    expect(requestBody.options.temperature).toBe(0.3);
  });
});