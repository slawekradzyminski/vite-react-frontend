import { test, expect } from '@playwright/test';
import { fulfillWithSchema } from '../mocks/backendContract';
import { Role } from '../../src/types/auth';

// Requests the app makes around sign-in, against a mocked backend.
test.describe('Sign-in requests (mocked backend)', () => {
  test('a successful sign-in loads the signed-in user once (T-067)', async ({ page }) => {
    // given
    await page.route(/\/api\/v1\//, (route) =>
      route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Not mocked' }) }));
    await page.route('**/api/v1/users/signin', (route) => fulfillWithSchema(route, 'LoginResponseDto', {
      token: 'mocked-access-token', refreshToken: 'mocked-refresh-token', username: 'alice', email: 'alice@example.com',
      firstName: 'Alice', lastName: 'Tester', roles: [Role.CLIENT], mfaRequired: false,
    }));
    let meRequests = 0;
    await page.route('**/api/v1/users/me', (route) => {
      meRequests += 1;
      return fulfillWithSchema(route, 'UserResponseDto', {
        id: 7, username: 'alice', email: 'alice@example.com', firstName: 'Alice', lastName: 'Tester', roles: [Role.CLIENT],
      });
    });
    await page.goto('/login');

    // when
    await page.getByTestId('login-username-input').fill('alice');
    await page.getByTestId('login-password-input').fill('secret-password');
    await page.getByTestId('login-submit-button').click();

    // then
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('username-profile-link')).toHaveText('Alice Tester');
    await page.waitForLoadState('networkidle');
    expect(meRequests).toBe(1);
  });
});
