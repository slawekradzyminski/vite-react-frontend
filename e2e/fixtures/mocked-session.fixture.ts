import { test as base, type Page } from '@playwright/test';
import { fulfillWithSchema, type BackendSchema } from '../mocks/backendContract';

export type MockedCustomer = BackendSchema<'UserResponseDto'> & { username: string };

export const MOCKED_CUSTOMER: MockedCustomer = {
  id: 501,
  username: 'paying-customer',
  email: 'paying.customer@example.test',
  firstName: 'Paying',
  lastName: 'Customer',
  roles: ['ROLE_CLIENT'],
};

// A signed-in customer whose every API call is mocked, so these journeys need no running stack.
// Unmocked API calls answer 404; routes registered later take precedence over the catch-all.
export const test = base.extend<{ customerPage: { page: Page; user: MockedCustomer } }>({
  customerPage: async ({ page }, use) => {
    await page.route(/\/api\/v1\//, async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Not mocked' }) });
    });
    await page.route('**/api/v1/users/me', async (route) => {
      await fulfillWithSchema(route, 'UserResponseDto', MOCKED_CUSTOMER);
    });
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mocked-access-token');
      window.localStorage.setItem('refreshToken', 'mocked-refresh-token');
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use({ page, user: MOCKED_CUSTOMER });
  },
});

export { expect } from '@playwright/test';
