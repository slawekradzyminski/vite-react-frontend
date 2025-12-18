import { Locator, Page } from '@playwright/test';
import { BaseLlmGeneratePage } from './baseLlm.page.object';

export class GeneratePage extends BaseLlmGeneratePage {
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

  async goto(path: string = '/llm/generate'): Promise<void> {
    await super.goto(path);
  }

  async enableThinking(): Promise<void> {
    await this.expandSettings();
    await this.thinkingCheckbox.check();
  }

  async disableThinking(): Promise<void> {
    await this.expandSettings();
    await this.thinkingCheckbox.uncheck();
  }

  async expandThinking(): Promise<void> {
    await this.thinkingResult.locator('summary').click();
  }
}
