import { type Page, type Locator } from '@playwright/test';
import { LoginRequest } from '../../src/types/auth';

export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly ssoButton: Locator;
  readonly toast: Locator;
  readonly registerLink: Locator;
  readonly mfaCodeInput: Locator;
  readonly mfaSubmitButton: Locator;

  constructor(protected readonly page: Page) {
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByTestId('login-submit-button');
    this.ssoButton = page.getByTestId('login-sso-button');
    this.toast = page.locator('[data-state="open"]');
    this.registerLink = page.getByRole('button', { name: 'Register' });
    this.mfaCodeInput = page.getByTestId('login-mfa-code-input');
    this.mfaSubmitButton = page.getByTestId('login-mfa-submit-button');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async attemptLogin(credentials: LoginRequest) {
    await this.usernameInput.fill(credentials.username);
    await this.passwordInput.fill(credentials.password);
    await this.signInButton.click();
  }

  async completeMfa(code: string) {
    await this.mfaCodeInput.fill(code);
    await this.mfaSubmitButton.click();
  }

  getValidationError(field: string): Locator {
    return this.page.getByText(`${field} is required`);
  }

  getMinLengthError(field: string, length: number): Locator {
    return this.page.getByText(`${field} must be at least ${length} characters`);
  }
}
