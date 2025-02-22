import { type Page, type Locator } from '@playwright/test';

export class OllamaPage {
  readonly promptInput: Locator;
  readonly generateButton: Locator;
  readonly markdownContainer: Locator;
  readonly errorMessage: Locator;

  constructor(protected readonly page: Page) {
    this.promptInput = page.locator('textarea#prompt');
    this.generateButton = page.getByRole('button', { name: /generate/i });
    this.markdownContainer = page.locator('[class*="markdownContainer"]');
    this.errorMessage = page.locator('text=/failed to fetch stream/i').first();
  }

  async goto() {
    await this.page.goto('/ollama-generate');
  }

  async generate(prompt: string) {
    await this.promptInput.fill(prompt);
    await this.generateButton.click();
  }

  getMarkdownElement(selector: string): Locator {
    return this.markdownContainer.locator(selector);
  }
} 