import { test as base, type Page } from '@playwright/test';
import { Role } from '../../src/types/auth';
import { fulfillWithSchema } from '../mocks/backendContract';

// A signed-in session that never touches a backend: the tokens are placeholders and every
// API call is answered by page.route mocks. Requests no test mocks get a 404, so a spec
// cannot silently depend on a real service.
type MockedSession = { page: Page; username: string };

async function signIn(page: Page, roles: Role[], username: string) {
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Not mocked' }) }),
  );
  await page.route('**/api/v1/users/me', (route) =>
    fulfillWithSchema(route, 'UserResponseDto', {
      id: 1, username, email: `${username}@example.com`, firstName: 'Mocked', lastName: 'User', roles,
    }),
  );
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'mocked-access-token');
    window.localStorage.setItem('refreshToken', 'mocked-refresh-token');
  });
}

export const test = base.extend<{ mockedClient: MockedSession; mockedAdmin: MockedSession }>({
  mockedClient: async ({ page }, use) => {
    await signIn(page, [Role.CLIENT], 'mocked-client');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use({ page, username: 'mocked-client' });
  },
  mockedAdmin: async ({ page }, use) => {
    await signIn(page, [Role.ADMIN], 'mocked-admin');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use({ page, username: 'mocked-admin' });
  },
});

export { expect } from '@playwright/test';
