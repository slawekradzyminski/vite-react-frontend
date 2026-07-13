import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page.object';
import { ProfilePage } from '../pages/profile.page.object';
import { generateTotp, millisecondsUntilNextTotpStep } from '../utils/totp.utils';

async function clearLogin(page: Page) {
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/login');
}

test.describe('Two-factor authentication', () => {
  test('enrolls, signs in with both factors, replaces recovery codes, and disables MFA', async ({ authenticatedPage }) => {
    test.setTimeout(120_000);
    const { page, user } = authenticatedPage;
    const profile = new ProfilePage(page);
    const login = new LoginPage(page);

    await profile.goto();
    await profile.enableMfaButton.click();
    const secret = await profile.mfaManualKey.inputValue();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    await profile.mfaConfirmCode.fill(generateTotp(secret));
    await profile.mfaConfirmButton.click();
    await expect(profile.mfaStatus).toHaveText('Enabled');
    await expect(profile.recoveryCodes).toHaveCount(8);
    const initialRecoveryCodes = await profile.recoveryCodes.allTextContents();
    expect(initialRecoveryCodes).toHaveLength(8);

    await clearLogin(page);
    await login.attemptLogin({ username: user.username, password: user.password });
    await expect(login.mfaCodeInput).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('token'))).toBeNull();
    await login.completeMfa(initialRecoveryCodes[0]);
    await expect(page).toHaveURL(/\/$/);

    await profile.goto();
    await page.waitForTimeout(millisecondsUntilNextTotpStep());
    await profile.regenerateCodesButton.click();
    await page.getByLabel('Current password').fill(user.password);
    await page.getByLabel('Authenticator code').fill(generateTotp(secret));
    await page.getByRole('button', { name: 'Replace codes' }).click();
    await expect(profile.recoveryCodes).toHaveCount(8);
    const replacementRecoveryCodes = await profile.recoveryCodes.allTextContents();
    expect(replacementRecoveryCodes).toHaveLength(8);
    expect(replacementRecoveryCodes).not.toEqual(initialRecoveryCodes);

    await clearLogin(page);
    await login.attemptLogin({ username: user.username, password: user.password });
    await expect(login.mfaCodeInput).toBeVisible();
    await page.waitForTimeout(millisecondsUntilNextTotpStep());
    await login.completeMfa(generateTotp(secret));
    await expect(page).toHaveURL(/\/$/);

    await profile.goto();
    await profile.disableMfaButton.click();
    await page.getByLabel('Current password').fill(user.password);
    await page.getByLabel('Authenticator or recovery code').fill(replacementRecoveryCodes[0]);
    await page.getByRole('button', { name: 'Disable two-factor authentication' }).click();
    await expect(profile.mfaStatus).toHaveText('Not enabled');

    await clearLogin(page);
    await login.attemptLogin({ username: user.username, password: user.password });
    await expect(page).toHaveURL(/\/$/);
    await expect(login.mfaCodeInput).not.toBeVisible();
  });
});
