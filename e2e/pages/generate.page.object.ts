import { Locator, Page, expect } from '@playwright/test';
import { LLMPage } from './llm.page.object';

export class GeneratePage extends LLMPage {
  readonly container: Locator;
  readonly sidebarToggle: Locator;
  readonly sidebar: Locator;
  readonly modelInput: Locator;
  readonly temperatureLabel: Locator;
  readonly temperatureSlider: Locator;
  readonly promptInput: Locator;
  readonly generateButton: Locator;
  readonly responseContent: Locator;
  readonly thinkingCheckbox: Locator;
  readonly thinkingResult: Locator;
  readonly thinkingContent: Locator;
  readonly settingsPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.container = page.getByTestId('ollama-generate-page');
    this.sidebarToggle = this.container.getByTestId('generate-sidebar-toggle');
    this.sidebar = this.container.getByTestId('generate-sidebar');
    this.modelInput = this.container.getByTestId('model-input');
    this.temperatureLabel = this.container.getByTestId('temperature-label');
    this.temperatureSlider = this.container.getByTestId('temperature-slider');
    this.promptInput = this.container.getByTestId('prompt-input');
    this.generateButton = this.container.getByTestId('generate-button');
    this.responseContent = this.container.getByTestId('generated-response');
    this.thinkingCheckbox = this.container.getByTestId('thinking-checkbox');
    this.thinkingResult = this.container.getByTestId('thinking-result');
    this.thinkingContent = this.container.getByTestId('thinking-content');
    this.settingsPanel = this.container.getByTestId('generate-settings-panel');
  }

  async goto(path: string = '/llm/generate') {
    await super.goto(path);
  }

  async generateResponse(prompt: string, model?: string) {
    if (model) {
      await this.expandSettings();
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
    await this.expandSettings();
    await this.thinkingCheckbox.check();
  }

  async disableThinking() {
    await this.expandSettings();
    await this.thinkingCheckbox.uncheck();
  }

  async expandThinking() {
    await this.thinkingResult.locator('summary').click();
  }

  async setTemperature(value: number) {
    await this.expandSettings();
    await this.temperatureSlider.fill(value.toString());
  }

  async expandSettings() {
    const isHidden = await this.sidebar.getAttribute('aria-hidden');
    if (isHidden !== 'false') {
      await this.sidebarToggle.click();
    }
    await expect(this.sidebar).toBeVisible();
    await expect(this.temperatureSlider).toBeVisible();
  }
}
