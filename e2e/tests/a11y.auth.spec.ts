import { test, expect, Locator, Page } from '@playwright/test';

async function expectNextFocus(page: Page, locator: Locator) {
  await page.keyboard.press('Tab');
  await expect(locator).toBeFocused();
}

test.describe('Auth keyboard accessibility', () => {
  test('keeps login page focus order predictable', async ({ page }) => {
    await page.goto('/login');

    const brandLink = page.getByTestId('brand-link');
    const loginNavLink = page.getByTestId('login-link');
    const registerNavLink = page.getByTestId('register-link');
    const usernameInput = page.getByTestId('login-username-input');
    const passwordInput = page.getByTestId('login-password-input');
    const forgotLink = page.getByTestId('login-forgot-link');
    const submitButton = page.getByTestId('login-submit-button');
    const ssoButton = page.getByTestId('login-sso-button');
    const googleButton = page.getByTestId('login-google-button');
    const githubButton = page.getByTestId('login-github-button');
    const registerLink = page.getByTestId('login-register-link');
    const blogLink = page.getByTestId('footer-blog-link');

    await brandLink.focus();
    await expect(brandLink).toBeFocused();
    await expectNextFocus(page, loginNavLink);
    await expectNextFocus(page, registerNavLink);
    await expectNextFocus(page, usernameInput);
    await expectNextFocus(page, passwordInput);
    await expectNextFocus(page, forgotLink);
    await expectNextFocus(page, submitButton);
    await expectNextFocus(page, ssoButton);
    await expectNextFocus(page, googleButton);
    await expectNextFocus(page, githubButton);
    await expectNextFocus(page, registerLink);
    await expectNextFocus(page, blogLink);
  });

  test('keeps register page focus order predictable', async ({ page }) => {
    await page.goto('/register');

    const brandLink = page.getByTestId('brand-link');
    const loginNavLink = page.getByTestId('login-link');
    const registerNavLink = page.getByTestId('register-link');
    const usernameInput = page.getByTestId('register-username-input');
    const emailInput = page.getByTestId('register-email-input');
    const passwordInput = page.getByTestId('register-password-input');
    const firstNameInput = page.getByTestId('register-firstname-input');
    const lastNameInput = page.getByTestId('register-lastname-input');
    const submitButton = page.getByTestId('register-submit-button');
    const signInLink = page.getByTestId('register-login-link');

    await brandLink.focus();
    await expect(brandLink).toBeFocused();
    await expectNextFocus(page, loginNavLink);
    await expectNextFocus(page, registerNavLink);
    await expectNextFocus(page, usernameInput);
    await expectNextFocus(page, emailInput);
    await expectNextFocus(page, passwordInput);
    await expectNextFocus(page, firstNameInput);
    await expectNextFocus(page, lastNameInput);
    await expectNextFocus(page, submitButton);
    await expectNextFocus(page, signInLink);
  });

  test('keeps forgot password page focus order predictable', async ({ page }) => {
    await page.goto('/forgot-password');

    const brandLink = page.getByTestId('brand-link');
    const loginNavLink = page.getByTestId('login-link');
    const registerNavLink = page.getByTestId('register-link');
    const identifierInput = page.getByTestId('forgot-identifier-input');
    const submitButton = page.getByTestId('forgot-submit-button');
    const backToLogin = page.getByTestId('forgot-back-to-login');

    await brandLink.focus();
    await expect(brandLink).toBeFocused();
    await expectNextFocus(page, loginNavLink);
    await expectNextFocus(page, registerNavLink);
    await expectNextFocus(page, identifierInput);
    await expectNextFocus(page, submitButton);
    await expectNextFocus(page, backToLogin);
  });

  test('keeps reset password page focus order predictable', async ({ page }) => {
    await page.goto('/reset?token=phase-11-demo-token');

    const brandLink = page.getByTestId('brand-link');
    const loginNavLink = page.getByTestId('login-link');
    const registerNavLink = page.getByTestId('register-link');
    const tokenInput = page.getByTestId('reset-token-input');
    const passwordInput = page.getByTestId('reset-password-input');
    const confirmPasswordInput = page.getByTestId('reset-confirm-password-input');
    const submitButton = page.getByTestId('reset-submit-button');
    const backToLogin = page.getByTestId('reset-back-to-login');

    await brandLink.focus();
    await expect(brandLink).toBeFocused();
    await expectNextFocus(page, loginNavLink);
    await expectNextFocus(page, registerNavLink);
    await expectNextFocus(page, tokenInput);
    await expect(tokenInput).toHaveValue('phase-11-demo-token');
    await expectNextFocus(page, passwordInput);
    await expectNextFocus(page, confirmPasswordInput);
    await expectNextFocus(page, submitButton);
    await expectNextFocus(page, backToLogin);
  });
});
