import { type Page, type Locator } from '@playwright/test';
import { LoginRequest } from '../../src/types/auth';

export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly toast: Locator;

  constructor(protected readonly page: Page) {
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.toast = page.locator('[data-state="open"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async attemptLogin(credentials: LoginRequest) {
    await this.usernameInput.fill(credentials.username);
    await this.passwordInput.fill(credentials.password);
    await this.signInButton.click();
  }

  getValidationError(field: string): Locator {
    return this.page.getByText(`${field} is required`);
  }

  getMinLengthError(field: string, length: number): Locator {
    return this.page.getByText(`${field} must be at least ${length} characters`);
  }
} 