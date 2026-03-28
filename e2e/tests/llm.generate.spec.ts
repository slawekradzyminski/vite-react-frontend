import { test, expect } from '../fixtures/auth.fixture';
import { GeneratePage } from '../pages/generate.page.object';
import { ollamaGenerateMocks } from '../mocks/ollamaMocks';

const GENERATE_PROMPT = 'Summarize the release plan';

test.describe('Ollama Generate', () => {
  let generatePage: GeneratePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    generatePage = new GeneratePage(authenticatedPage.page);
  });

  test('renders deterministic response from the mock', async () => {
    await ollamaGenerateMocks.mockSuccess(generatePage.page);
    await generatePage.goto();
    await generatePage.generateResponse(GENERATE_PROMPT);
    await generatePage.waitForGenerationComplete();

    await expect(generatePage.responseContent).toContainText('Release plan: mock Ollama service ready');
  });

  test('uses qwen3.5:2b by default and allows editing the value', async () => {
    await generatePage.goto();
    await generatePage.expandSettings();
    await expect(generatePage.modelInput).toHaveValue('qwen3.5:2b');

    await generatePage.modelInput.fill('custom-model');
    await expect(generatePage.modelInput).toHaveValue('custom-model');
  });

  test('shows thinking details when the option is enabled', async () => {
    await ollamaGenerateMocks.mockWithThinking(generatePage.page);
    await generatePage.goto();
    await generatePage.enableThinking();
    await generatePage.generateResponse(GENERATE_PROMPT);
    await generatePage.waitForGenerationComplete();

    await expect(generatePage.thinkingResult).toBeVisible();
    await generatePage.expandThinking();
    await expect(generatePage.thinkingContent).toContainText('Reviewing the release checklist');
  });

  test('updates temperature label when slider changes', async () => {
    await generatePage.goto();
    await generatePage.expandSettings();
    await generatePage.setTemperature(0.3);
    await expect(generatePage.temperatureLabel).toContainText('0.30');
  });
});
