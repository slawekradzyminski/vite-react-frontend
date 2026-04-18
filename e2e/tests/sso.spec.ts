import { test, expect } from '@playwright/test';
import { SSO_PASSWORD, SSO_USERNAME } from '../config/sso.config';
import { LoginPage } from '../pages/login.page.object';

test.describe('SSO login', () => {
  test('authenticates through the real Keycloak redirect flow', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.ssoButton.click();

    await expect(page).toHaveURL(/\/protocol\/openid-connect\/auth/);
    await page.getByRole('textbox', { name: 'Username or email' }).fill(SSO_USERNAME);
    await page.getByRole('textbox', { name: 'Password' }).fill(SSO_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/');
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('token'))).not.toBeNull();
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('refreshToken'))).not.toBeNull();
  });
});
