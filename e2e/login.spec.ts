import { test, expect } from '@playwright/test';
import { getRandomUser } from './generators/userGenerator';
import { registerUser } from './http/postSignUp';
import { LoginPage } from './pages/login.page';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // given
    const user = getRandomUser();
    await registerUser(user);

    // when
    await loginPage.attemptLogin({
      username: user.username,
      password: user.password,
    });

    // then
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // given
    const invalidCredentials = {
      username: 'nonexistent',
      password: 'wrongpassword',
    };

    // when
    await loginPage.attemptLogin(invalidCredentials);

    // then
    await expect(loginPage.toast).toContainText('Invalid username/password', { timeout: 10000 });
    await expect(page).toHaveURL('/login');
  });

  test('should show validation errors for empty fields', async () => {
    // when
    await loginPage.signInButton.click();

    // then
    const validationErrors = ['Username', 'Password'];

    for (const field of validationErrors) {
      const error = loginPage.getValidationError(field);
      await expect(error).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show validation error for username less than 4 characters', async () => {
    // given
    const shortUsername = '123';

    // when
    await loginPage.usernameInput.fill(shortUsername);
    await loginPage.passwordInput.fill('validpassword');
    await loginPage.signInButton.click();

    // then
    const error = loginPage.getMinLengthError('Username', 4);
    await expect(error).toBeVisible();
  });


  test('should navigate to register page when clicking Register link', async ({ page }) => {
    // when
    await loginPage.registerLink.click();

    // then
    await expect(page).toHaveURL('/register');
  });
}); 