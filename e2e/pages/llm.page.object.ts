import { Page, Locator } from '@playwright/test';

export class LLMPage {
  readonly page: Page;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.errorMessage = page.getByText('Failed to fetch stream: Internal Server Error', { exact: true });
  }

  async goto() {
    await this.page.goto('/llm');
  }
}
