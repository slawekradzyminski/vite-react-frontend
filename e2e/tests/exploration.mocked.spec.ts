import { test, expect } from '../fixtures/mocked-session.fixture';
import { fulfillWithSchema } from '../mocks/backendContract';
import { cartMocks } from '../mocks/cartMocks';
import { orderMocks, type OrderState } from '../mocks/orderMocks';
import { expectNoAxeViolations } from '../utils/axe.utils';

// Regressions for the 2026-11 exploration findings fixed in 3.14.0 (X-03, X-12, X-14, X-30,
// X-32, X-33, X-34), each with an axe scan of the touched page. Every API call is mocked.
test.describe('Exploration findings (mocked backend)', () => {
  test('a client gets no user directory: no home card, /users goes home, the email form never loads GET /users (X-12)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    const userListRequests: string[] = [];
    page.on('request', (request) => {
      if (/\/api\/v1\/users(\?.*)?$/.test(new URL(request.url()).pathname + new URL(request.url()).search)) {
        userListRequests.push(request.url());
      }
    });

    // when
    await page.goto('/');

    // then
    await expect(page.getByTestId('home-welcome-title')).toBeVisible();
    await expect(page.getByTestId('home-users-button')).toHaveCount(0);
    await expectNoAxeViolations(page);

    // when
    await page.goto('/users');

    // then
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('users-page')).toHaveCount(0);

    // when
    await page.goto('/email');
    await expect(page.getByTestId('email-form')).toBeVisible();

    // then
    await expect(page.getByTestId('users-datalist')).toHaveCount(0);
    expect(userListRequests).toEqual([]);
  });

  test('an admin keeps the user directory and the recipient picker (X-12)', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    await page.route(/\/api\/v1\/users(\?.*)?$/, (route) => fulfillWithSchema(route, 'UserResponseDto', [
      { id: 2, username: 'client', email: 'c***@example.com', firstName: 'Client', lastName: 'User', roles: ['ROLE_CLIENT'] },
    ]));

    // when
    await page.goto('/');
    await page.getByTestId('home-users-button').click();

    // then
    await expect(page.getByTestId('user-email-2')).toHaveText('c***@example.com');

    // when
    await page.goto('/email');

    // then
    await expect(page.getByTestId('users-datalist').locator('option')).toHaveCount(1);
  });

  test('checkout shows server field errors inline, never as a native dialog (X-30)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    const dialogs: string[] = [];
    page.on('dialog', (dialog) => { dialogs.push(dialog.message()); void dialog.dismiss(); });
    await cartMocks.mockCartWithItems(page);
    await page.route('**/api/v1/orders', (route) => route.request().method() === 'POST'
      ? fulfillWithSchema(route, 'ValidationErrorsDto', { street: 'Street is required', country: 'Country is required' }, 400)
      : route.fallback());
    await page.goto('/checkout');

    // when: whitespace and a malformed ZIP code are caught before any request
    await page.getByTestId('checkout-street-input').fill('   ');
    await page.getByTestId('checkout-city-input').fill('Warsaw');
    await page.getByTestId('checkout-state-input').fill('Mazovia');
    await page.getByTestId('checkout-zip-input').fill('12abc');
    await page.getByTestId('checkout-country-input').fill('Poland');
    await page.getByTestId('checkout-submit-button').click();

    // then
    await expect(page.getByTestId('checkout-street-error')).toHaveText('Street address is required');
    await expect(page.getByTestId('checkout-zip-error')).toHaveText('Invalid postal/zip code format');
    await expectNoAxeViolations(page);

    // when: the server still rejects the address
    await page.getByTestId('checkout-street-input').fill('Main 1');
    await page.getByTestId('checkout-zip-input').fill('00-001');
    await page.getByTestId('checkout-submit-button').click();

    // then
    await expect(page.getByTestId('checkout-street-error')).toHaveText('Street is required');
    await expect(page.getByTestId('checkout-country-error')).toHaveText('Country is required');
    await expect(page).toHaveURL(/\/checkout$/);
    await expectNoAxeViolations(page);

    // when: an unexpected failure
    await page.unroute('**/api/v1/orders');
    await page.route('**/api/v1/orders', (route) => fulfillWithSchema(route, 'ErrorDto', { message: 'Internal server error' }, 500));
    await page.getByTestId('checkout-submit-button').click();

    // then
    await expect(page.getByTestId('checkout-submit-error')).toHaveText('Internal server error');
    expect(dialogs).toEqual([]);
    await expectNoAxeViolations(page);
  });

  test('cancelling an order asks in an in-app dialog (X-30)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    const dialogs: string[] = [];
    page.on('dialog', (dialog) => { dialogs.push(dialog.message()); void dialog.dismiss(); });
    const order: OrderState = {
      id: 77, username: 'mocked-client', items: [{ id: 1, productId: 7, productName: 'Desk Lamp', quantity: 1, unitPrice: 25, totalPrice: 25 }],
      totalAmount: 25, status: 'PENDING', createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-01T10:00:00Z',
      shippingAddress: { street: 'Main 1', city: 'Warsaw', state: 'Mazowieckie', zipCode: '00-001', country: 'Poland' },
    };
    await orderMocks.mockOrderWithState(page, order);
    await orderMocks.mockCancelOrder(page, order);
    await page.goto('/orders/77');

    // when
    await page.getByTestId('order-details-cancel-button').click();

    // then
    const dialog = page.getByRole('dialog', { name: 'Cancel order #77?' });
    await expect(dialog).toBeVisible();
    await expectNoAxeViolations(page);

    // when
    await page.keyboard.press('Escape');

    // then
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('order-details-status')).toHaveText('PENDING');

    // when
    await page.getByTestId('order-details-cancel-button').click();
    await page.getByTestId('order-cancel-dialog-confirm').click();

    // then
    await expect(page.getByTestId('order-details-status')).toHaveText('CANCELLED');
    expect(dialogs).toEqual([]);
  });

  test('registration shows the server field errors under their fields (X-14)', async ({ page }) => {
    // given
    await page.route('**/api/v1/users/signup', (route) => fulfillWithSchema(route, 'ValidationErrorsDto', {
      email: 'Email should be valid',
    }, 400));
    await page.goto('/register');

    // when: a whitespace-only username is caught on the client
    await page.getByTestId('register-username-input').fill('     ');
    await page.getByTestId('register-email-input').fill('new.user@example.com');
    await page.getByTestId('register-password-input').fill('password123');
    await page.getByTestId('register-firstname-input').fill('Newton');
    await page.getByTestId('register-lastname-input').fill('Userson');
    await page.getByTestId('register-submit-button').click();

    // then
    await expect(page.getByTestId('register-username-error')).toHaveText('Username is required');

    // when
    await page.getByTestId('register-username-input').fill('new-user');
    await page.getByTestId('register-submit-button').click();

    // then
    await expect(page.getByTestId('register-email-error')).toHaveText('Email should be valid');
    await expect(page.getByTestId('register-submit-error')).toHaveCount(0);
    await expectNoAxeViolations(page);
  });

  for (const path of ['/this-page-does-not-exist', '/swagger.json']) {
    test(`unknown route ${path} shows a not-found page (X-32)`, async ({ page }) => {
      // when
      await page.goto(path);

      // then
      await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
      await expect(page).toHaveTitle('Page not found – Awesome Testing');
      await expectNoAxeViolations(page);

      // when
      await page.getByTestId('not-found-home-link').click();

      // then: home needs a session
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test('the email form is empty again after a successful send (X-33)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    let sent: unknown;
    await page.route('**/api/v1/email', (route) => {
      sent = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/email');

    // when
    await page.getByTestId('email-to-input').fill('friend@example.com');
    await page.getByTestId('email-subject-input').fill('Hello there');
    await page.getByTestId('email-message-input').fill('A message long enough to send.');
    await page.getByTestId('email-submit-button').click();

    // then
    await expect(page.getByTestId('toast-description')).toHaveText('Email queued for delivery');
    await expect(page.getByTestId('email-to-input')).toHaveValue('');
    await expect(page.getByTestId('email-subject-input')).toHaveValue('');
    await expect(page.getByTestId('email-message-input')).toHaveValue('');
    // Clients send no template: the backend's GENERIC default is the only one they may use.
    expect(sent).toEqual({ to: 'friend@example.com', subject: 'Hello there', message: 'A message long enough to send.' });
    await expectNoAxeViolations(page);
  });

  for (const path of ['/llm/chat', '/llm/tools']) {
    test(`${path} message field has an accessible name (X-34)`, async ({ mockedClient }) => {
      // when
      await mockedClient.page.goto(path);

      // then
      await expect(mockedClient.page.getByRole('textbox', { name: 'Message' })).toBeVisible();
      await expectNoAxeViolations(mockedClient.page);
    });
  }

  test('logout and the next sign-in each start a new traffic session (X-03)', async ({ page }) => {
    // given: a signed-in user in a browser that has a traffic session
    const user = { id: 1, username: 'first-user', email: 'first@example.com', firstName: 'First', lastName: 'User', roles: ['ROLE_CLIENT' as const] };
    await page.route(/\/api\/v1\//, (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"Not mocked"}' }));
    await page.route('**/api/v1/users/me', (route) => fulfillWithSchema(route, 'UserResponseDto', user));
    await page.route('**/api/v1/users/logout', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    const signInSessions: string[] = [];
    await page.route('**/api/v1/users/signin', (route) => {
      signInSessions.push(route.request().headers()['x-client-session-id']);
      return fulfillWithSchema(route, 'LoginResponseDto', { token: 'next-access', refreshToken: 'next-refresh', ...user });
    });
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'first-access');
      localStorage.setItem('refreshToken', 'first-refresh');
      localStorage.setItem('clientSessionId', 'first-user-traffic-session');
    });
    await page.goto('/');
    await expect(page.getByTestId('logout-button')).toBeVisible();

    // when
    await page.getByTestId('logout-button').click();

    // then
    await expect(page).toHaveURL(/\/login$/);
    const afterLogout = await page.evaluate(() => localStorage.getItem('clientSessionId'));
    expect(afterLogout).toMatch(/^[A-Za-z0-9_-]{16,128}$/);
    expect(afterLogout).not.toBe('first-user-traffic-session');

    // when
    await page.getByTestId('login-username-input').fill('next-user');
    await page.getByTestId('login-password-input').fill('password123');
    await page.getByTestId('login-submit-button').click();

    // then
    await expect(page).toHaveURL(/\/$/);
    const afterSignIn = await page.evaluate(() => localStorage.getItem('clientSessionId'));
    expect(signInSessions).toEqual([afterSignIn]);
    expect(afterSignIn).not.toBe(afterLogout);
    expect(afterSignIn).not.toBe('first-user-traffic-session');
  });
});
