import { Locator } from '@playwright/test';
import { LLMPage } from './llm.page.object';

export class GeneratePage extends LLMPage {
  readonly generateTab: Locator;
  readonly promptInput: Locator;
  readonly generateButton: Locator;
  readonly generateContent: Locator;

  constructor(page: any) {
    super(page);
    this.generateTab = page.getByTestId('generate-tab');
    this.promptInput = page.getByRole('textbox', { name: 'Prompt' });
    this.generateButton = page.getByRole('button', { name: /generate/i });
    this.generateContent = page.getByTestId('generate-content');
  }

  async openGenerateTab() {
    await this.generateTab.click();
  }

  async generate(prompt: string, model?: string) {
    if (model) {
      await this.modelInput.clear();
      await this.modelInput.fill(model);
    }
    await this.promptInput.fill(prompt);
    await this.generateButton.click();
  }

  getMarkdownElement(selector: string) {
    return this.generateContent.locator(`[class*="markdownContainer"] ${selector}`);
  }
} 