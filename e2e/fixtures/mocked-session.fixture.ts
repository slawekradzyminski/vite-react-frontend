import { test as base, type Page } from '@playwright/test';
import { Role } from '../../src/types/auth';
import { fulfillWithSchema, type BackendSchema } from '../mocks/backendContract';

// Signed-in sessions that never touch a backend: the tokens are placeholders and every API
// call is answered by page.route mocks. Requests no test mocks get a 404, so a spec cannot
// silently depend on a real service; routes registered later take precedence over the catch-all.
export type MockedUser = BackendSchema<'UserResponseDto'> & { username: string };
export type MockedCustomer = MockedUser;
type MockedSession = { page: Page; username: string };

export const MOCKED_CUSTOMER: MockedCustomer = {
  id: 501,
  username: 'paying-customer',
  email: 'paying.customer@example.test',
  firstName: 'Paying',
  lastName: 'Customer',
  roles: [Role.CLIENT],
};

const mockedUser = (username: string, roles: Role[]): MockedUser => ({
  id: 1, username, email: `${username}@example.com`, firstName: 'Mocked', lastName: 'User', roles,
});

async function signIn(page: Page, user: MockedUser) {
  await page.route(/\/api\/v1\//, (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Not mocked' }) }),
  );
  await page.route('**/api/v1/users/me', (route) => fulfillWithSchema(route, 'UserResponseDto', user));
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'mocked-access-token');
    window.localStorage.setItem('refreshToken', 'mocked-refresh-token');
  });
}

export const test = base.extend<{
  customerPage: { page: Page; user: MockedCustomer };
  mockedClient: MockedSession;
  mockedAdmin: MockedSession;
}>({
  customerPage: async ({ page }, use) => {
    await signIn(page, MOCKED_CUSTOMER);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use({ page, user: MOCKED_CUSTOMER });
  },
  mockedClient: async ({ page }, use) => {
    await signIn(page, mockedUser('mocked-client', [Role.CLIENT]));
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use({ page, username: 'mocked-client' });
  },
  mockedAdmin: async ({ page }, use) => {
    await signIn(page, mockedUser('mocked-admin', [Role.ADMIN]));
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use({ page, username: 'mocked-admin' });
  },
});

export { expect } from '@playwright/test';
