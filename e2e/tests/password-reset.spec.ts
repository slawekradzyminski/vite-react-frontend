import { test, expect } from '@playwright/test';
import { getRandomUser } from '../generators/userGenerator';
import { registerUser } from '../http/postSignUp';
import { clearLocalOutbox, getLatestResetToken } from '../http/localEmailOutbox';
import { ForgotPasswordPage } from '../pages/forgot-password.page.object';
import { ResetPasswordPage } from '../pages/reset-password.page.object';

test.describe('Password Reset Flow', () => {
  test.beforeEach(async ({ request }) => {
    await clearLocalOutbox(request);
  });

  test('user can request password reset and set a new password', async ({ page, request }) => {
    const user = getRandomUser();
    await registerUser(user);

    const forgotPage = new ForgotPasswordPage(page);
    await page.goto('/login');
    await page.getByTestId('login-forgot-link').click();
    await expect(page).toHaveURL('/forgot-password');

    await forgotPage.requestReset(user.username);
    await expect(forgotPage.toastTitle.filter({ hasText: 'Check your email' })).toBeVisible();

    let token: string;
    if (await forgotPage.tokenField.isVisible()) {
      token = await forgotPage.tokenField.inputValue();
    } else {
      const data = await getLatestResetToken(request);
      token = data.token;
    }
    expect(token).toBeTruthy();

    const resetPage = new ResetPasswordPage(page);
    await resetPage.gotoWithToken(token);
    await resetPage.resetPassword(token, 'NewPassword123!');

    await expect(page).toHaveURL('/login');

    await page.getByTestId('login-username-input').fill(user.username);
    await page.getByTestId('login-password-input').fill('NewPassword123!');
    await page.getByTestId('login-submit-button').click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
  });
});
