import { Page, Locator } from '@playwright/test';

export class OllamaPage {
  readonly promptInput: Locator;
  readonly modelInput: Locator;
  readonly generateButton: Locator;
  readonly errorMessage: Locator;
  readonly markdownContainer: Locator;
  readonly generateTab: Locator;

  constructor(private readonly page: Page) {
    this.promptInput = page.getByRole('textbox', { name: 'Prompt' });
    this.modelInput = page.getByRole('textbox', { name: 'Model' });
    this.generateButton = page.getByRole('button', { name: /generate/i });
    this.errorMessage = page.locator('text=/failed to fetch stream/i').first();
    this.markdownContainer = page.locator('[class*="markdownContainer"]');
    this.generateTab = page.getByTestId('generate-tab');
  }

  async goto() {
    await this.page.goto('/llm');
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
    return this.markdownContainer.locator(selector);
  }
} 