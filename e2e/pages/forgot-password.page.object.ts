import { type Page, type Locator } from '@playwright/test';

export class ForgotPasswordPage {
  readonly identifierInput: Locator;
  readonly submitButton: Locator;
  readonly tokenField: Locator;
  readonly toastTitle: Locator;

  constructor(private readonly page: Page) {
    this.identifierInput = page.getByTestId('forgot-identifier-input');
    this.submitButton = page.getByTestId('forgot-submit-button');
    this.tokenField = page.getByTestId('forgot-token-value');
    this.toastTitle = page.getByTestId('toast-title');
  }

  async goto() {
    await this.page.goto('/forgot-password');
  }

  async requestReset(identifier: string) {
    await this.identifierInput.fill(identifier);
    await this.submitButton.click();
  }
}
