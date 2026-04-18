import { test, expect } from '../fixtures/sso-auth.fixture';
import { SSO_USERNAME } from '../config/sso.config';

test.describe('SSO auth fixture', () => {
  test('starts the app with SSO-backed app tokens', async ({ ssoAuthenticatedPage }) => {
    await ssoAuthenticatedPage.page.goto('/');

    await expect(ssoAuthenticatedPage.page).toHaveURL('/');
    await expect.poll(async () => (
      ssoAuthenticatedPage.page.evaluate(() => localStorage.getItem('token'))
    )).toBe(ssoAuthenticatedPage.token);
    await expect.poll(async () => (
      ssoAuthenticatedPage.page.evaluate(() => localStorage.getItem('refreshToken'))
    )).toBe(ssoAuthenticatedPage.refreshToken);
    expect(ssoAuthenticatedPage.username).toBe(SSO_USERNAME);
  });
});
