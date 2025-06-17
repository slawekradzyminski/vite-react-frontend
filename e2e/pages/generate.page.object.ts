import { Locator } from '@playwright/test';
import { LLMPage } from './llm.page.object';

export class GeneratePage extends LLMPage {
  readonly generateTab: Locator;
  readonly promptInput: Locator;
  readonly generateButton: Locator;
  readonly responseContent: Locator;
  readonly thinkingCheckbox: Locator;
  readonly thinkingResult: Locator;
  readonly thinkingContent: Locator;

  constructor(page: any) {
    super(page);
    this.generateTab = page.getByTestId('generate-tab');
    this.promptInput = page.getByTestId('prompt-input');
    this.generateButton = page.getByTestId('generate-button');
    this.responseContent = page.getByTestId('generated-response');
    this.thinkingCheckbox = page.getByTestId('thinking-checkbox');
    this.thinkingResult = page.getByTestId('thinking-result');
    this.thinkingContent = this.thinkingResult.locator('div').nth(1); // Content inside the details
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

  async enableThinking() {
    await this.thinkingCheckbox.check();
  }

  async disableThinking() {
    await this.thinkingCheckbox.uncheck();
  }

  async expandThinking() {
    await this.thinkingResult.locator('summary').click();
  }

  getResponseMarkdownElement(selector: string) {
    return this.responseContent.locator(`[class*="markdownContainer"] ${selector}`);
  }
} 