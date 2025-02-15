import { type Page, type Locator } from '@playwright/test';
import { RegisterRequest } from '../../src/types/auth';

export class RegisterPage {
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly createAccountButton: Locator;
  readonly toast: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByLabel('Username');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.firstNameInput = page.getByLabel('First Name');
    this.lastNameInput = page.getByLabel('Last Name');
    this.createAccountButton = page.getByRole('button', { name: 'Create account' });
    this.toast = page.locator('[data-state="open"]');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async attemptRegister(user: RegisterRequest) {
    await this.usernameInput.fill(user.username);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.createAccountButton.click();
  }

  getValidationError(field: string): Locator {
    return this.page.getByText(`${field} is required`);
  }

  getMinLengthError(field: string, length: number): Locator {
    return this.page.getByText(`${field} must be at least ${length} characters`);
  }
} 