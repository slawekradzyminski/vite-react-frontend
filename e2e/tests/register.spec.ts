import { test, expect } from '@playwright/test';
import { getRandomUser } from '../generators/userGenerator';
import { registerUser } from '../http/postSignUp';
import { RegisterPage } from '../pages/register.page';

test.describe('Register Page', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('should successfully register with valid data', async ({ page }) => {
    // given
    const user = getRandomUser();

    // when
    await registerPage.attemptRegister(user);

    // then
    await expect(page).toHaveURL('/login', { timeout: 10000 });
    await expect(registerPage.toast).toContainText('Registration successful! You can now log in.');
  });

  test('should show error when username already exists', async ({ page }) => {
    // given
    const user = getRandomUser();
    await registerUser(user);

    // when
    await registerPage.attemptRegister(user);

    // then
    await expect(registerPage.toast).toContainText('Username already exists');
    await expect(page).toHaveURL('/register');
  });

  test('should show validation errors for empty fields', async () => {
    // when
    await registerPage.createAccountButton.click();

    // then
    const validationErrors = [
      'Username', 'Email', 'Password', 'First name', 'Last name'
    ];

    for (const field of validationErrors) {
      const error = registerPage.getValidationError(field);
      await expect(error).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show validation error for username less than 4 characters', async () => {
    // given
    const invalidUser = {
      ...getRandomUser(),
      username: '123'
    };

    // when
    await registerPage.attemptRegister(invalidUser);

    // then
    const error = registerPage.getMinLengthError('Username', 4);
    await expect(error).toBeVisible();
  });

  test('should navigate to login page when clicking Sign In link', async ({ page }) => {
    // when
    await registerPage.signInLink.click();

    // then
    await expect(page).toHaveURL('/login');
  });
}); 