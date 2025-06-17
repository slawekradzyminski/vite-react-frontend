import { test, expect } from '../fixtures/auth.fixture';
import { ollamaGenerateMocks } from '../mocks/ollamaMocks';
import { GeneratePage } from '../pages/generate.page.object';

test.describe('Ollama Generate', () => {
  let generatePage: GeneratePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    generatePage = new GeneratePage(authenticatedPage.page);
  });

  test('should display generated response with markdown formatting', async ({ authenticatedPage }) => {
    // given
    await ollamaGenerateMocks.mockSuccess(authenticatedPage.page);
    await generatePage.goto();
    await generatePage.openGenerateTab();

    // when
    await generatePage.generateResponse('Write a test response');

    // then
    await expect(generatePage.responseContent).toContainText('Heading');
    await expect(generatePage.getResponseMarkdownElement('h1')).toContainText('Heading');
    await expect(generatePage.getResponseMarkdownElement('ol > li, ul > li')).toHaveCount(2);
  });

  test('should initialize with default model and allow model change', async ({ authenticatedPage }) => {
    // given
    await ollamaGenerateMocks.mockSuccess(authenticatedPage.page);
    await generatePage.goto();
    await generatePage.openGenerateTab();

    // when
    await expect(generatePage.modelInput).toHaveValue('qwen3:0.6b');
    await generatePage.generateResponse('Test prompt', 'mistral:7b');

    // then
    await expect(generatePage.modelInput).toHaveValue('mistral:7b');
    await expect(generatePage.responseContent).toContainText('Heading');
  });

  test('should handle streaming errors gracefully', async ({ authenticatedPage }) => {
    // given
    await ollamaGenerateMocks.mockError(authenticatedPage.page);
    await generatePage.goto();
    await generatePage.openGenerateTab();

    // when
    await generatePage.generateResponse('Test prompt');

    // then
    await expect(generatePage.errorMessage).toBeVisible();
    await expect(generatePage.promptInput).toBeEnabled();
  });

  test('should initialize with default temperature and allow adjustment', async ({ authenticatedPage }) => {
    // given
    let requestBody: any;
    await ollamaGenerateMocks.mockSuccess(authenticatedPage.page, async (route) => {
      requestBody = JSON.parse(route.request().postData() || '{}');
    });
    await generatePage.goto();
    await generatePage.openGenerateTab();

    // when
    await expect(generatePage.temperatureSlider).toHaveValue('0.8');
    await generatePage.setTemperature(0.3);
    await generatePage.generateResponse('Test prompt');

    // then
    expect(requestBody.options.temperature).toBe(0.3);
  });

  test('should display thinking checkbox with bulb icon', async () => {
    // given
    await generatePage.goto();
    await generatePage.openGenerateTab();

    // when & then
    await expect(generatePage.thinkingCheckbox).toBeVisible();
    await expect(generatePage.thinkingCheckbox).not.toBeChecked();
    await expect(generatePage.page.getByText('Thinking')).toBeVisible();
  });

  test('should enable thinking mode and include in request', async ({ authenticatedPage }) => {
    // given
    let requestBody: any;
    await ollamaGenerateMocks.mockSuccess(authenticatedPage.page, async (route) => {
      requestBody = JSON.parse(route.request().postData() || '{}');
    });
    await generatePage.goto();
    await generatePage.openGenerateTab();

    // when
    await generatePage.enableThinking();
    await generatePage.generateResponse('Test thinking prompt');

    // then
    expect(requestBody.think).toBe(true);
  });

  test('should display thinking content when present', async ({ authenticatedPage }) => {
    // given
    await ollamaGenerateMocks.mockWithThinking(authenticatedPage.page);
    await generatePage.goto();
    await generatePage.openGenerateTab();

    // when
    await generatePage.generateResponse('Test thinking prompt');

    // then
    await expect(generatePage.thinkingResult).toBeVisible();
    await expect(generatePage.thinkingResult.getByText('Thinking')).toBeVisible();
  });

  test('should expand thinking content when clicked', async ({ authenticatedPage }) => {
    // given
    await ollamaGenerateMocks.mockWithThinking(authenticatedPage.page);
    await generatePage.goto();
    await generatePage.openGenerateTab();
    await generatePage.generateResponse('Test thinking prompt');

    // when
    await generatePage.expandThinking();

    // then
    await expect(generatePage.thinkingResult.locator('div').nth(0)).toBeVisible();
    await expect(generatePage.thinkingResult.locator('div').nth(0)).toContainText('Let me think about this...');
  });

  test('should stream thinking content in real-time', async ({ authenticatedPage }) => {
    // given
    await ollamaGenerateMocks.mockStreamingThinking(authenticatedPage.page);
    await generatePage.goto();
    await generatePage.openGenerateTab();

    // when
    await generatePage.generateResponse('Test streaming thinking');

    // then
    await expect(generatePage.thinkingResult).toBeVisible();
    // Expand the thinking details to see the content
    await generatePage.expandThinking();
    await expect(generatePage.thinkingResult.locator('div').nth(0)).toBeVisible();
  });
});