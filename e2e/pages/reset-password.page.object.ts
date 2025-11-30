import { type Page, type Locator } from '@playwright/test';

export class ResetPasswordPage {
  readonly tokenInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.tokenInput = page.getByTestId('reset-token-input');
    this.newPasswordInput = page.getByTestId('reset-password-input');
    this.confirmPasswordInput = page.getByTestId('reset-confirm-password-input');
    this.submitButton = page.getByTestId('reset-submit-button');
  }

  async gotoWithToken(token: string) {
    await this.page.goto(`/reset?token=${token}`);
  }

  async resetPassword(token: string, newPassword: string) {
    await this.tokenInput.fill(token);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.submitButton.click();
  }
}
