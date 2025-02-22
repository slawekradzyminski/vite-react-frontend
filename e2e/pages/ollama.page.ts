import { Page, Locator } from '@playwright/test';

export class OllamaPage {
  readonly promptInput: Locator;
  readonly modelInput: Locator;
  readonly generateButton: Locator;
  readonly errorMessage: Locator;
  readonly markdownContainer: Locator;

  constructor(private readonly page: Page) {
    this.promptInput = page.getByLabel(/prompt/i);
    this.modelInput = page.getByLabel(/model/i);
    this.generateButton = page.getByRole('button', { name: /generate/i });
    this.errorMessage = page.locator('text=/failed to fetch stream/i').first();
    this.markdownContainer = page.locator('[class*="markdownContainer"]');
  }

  async goto() {
    await this.page.goto('/ollama-generate');
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