import { Locator, Page } from '@playwright/test';
import { LLMPage } from './llm.page.object';

export class GeneratePage extends LLMPage {
  readonly generateTab: Locator;
  readonly container: Locator;
  readonly modelInput: Locator;
  readonly temperatureLabel: Locator;
  readonly temperatureSlider: Locator;
  readonly promptInput: Locator;
  readonly generateButton: Locator;
  readonly responseContent: Locator;
  readonly thinkingCheckbox: Locator;
  readonly thinkingResult: Locator;
  readonly thinkingContent: Locator;

  constructor(page: Page) {
    super(page);
    this.generateTab = page.getByTestId('generate-tab');
    this.container = page.getByTestId('generate-content');
    this.modelInput = this.container.getByTestId('model-input');
    this.temperatureLabel = this.container.getByTestId('temperature-label');
    this.temperatureSlider = this.container.getByTestId('temperature-slider');
    this.promptInput = this.container.getByTestId('prompt-input');
    this.generateButton = this.container.getByTestId('generate-button');
    this.responseContent = this.container.getByTestId('generated-response');
    this.thinkingCheckbox = this.container.getByTestId('thinking-checkbox');
    this.thinkingResult = this.container.getByTestId('thinking-result');
    this.thinkingContent = this.thinkingResult.locator('div').nth(1);
  }

  async openGenerateTab() {
    await this.generateTab.click();
  }

  async generateResponse(prompt: string, model?: string) {
    if (model) {
      await this.modelInput.clear();
      await this.modelInput.fill(model);
    }
    await this.promptInput.fill(prompt);
    await this.generateButton.click();
  }

  async waitForGenerationComplete() {
    await this.generateButton.waitFor({ state: 'visible' });
    await this.page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="generate-button"]');
      return button && (!button.hasAttribute('disabled') || button.textContent === 'Generate');
    }, { timeout: 30000 });
  }

  async enableThinking() {
    await this.thinkingCheckbox.check();
  }

  async disableThinking() {
    await this.thinkingCheckbox.uncheck();
  }

  async expandThinking() {
    await this.thinkingResult.locator('summary').click();
  }

  async setTemperature(value: number) {
    await this.temperatureSlider.fill(value.toString());
  }
}
