import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

async function fixture(request: APIRequestContext) {
  const username = `gql${randomUUID().replaceAll('-', '').slice(0, 12)}`;
  const password = 'CommerceTesting123!';
  const signup = await request.post('/api/v1/users/signup', { data: {
    username, password, email: `${username}@example.com`, firstName: 'Commerce', lastName: 'Tester', roles: ['ROLE_CLIENT'],
  } });
  expect(signup.status()).toBe(201);
  const adminLogin = await request.post('/api/v1/users/signin', { data: { username: 'admin', password: 'LocalDemoAdmin123!' } });
  expect(adminLogin.ok()).toBe(true);
  const { token } = await adminLogin.json();
  const response = await request.post('/api/v1/products', { headers: { Authorization: `Bearer ${token}` }, data: {
    name: `Commerce ${username}`, description: 'Transport contract fixture', price: 19.99, stockQuantity: 10, category: 'Training',
  } });
  expect(response.ok()).toBe(true);
  return { username, password, product: await response.json() };
}

async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('login-username-input').fill(username);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
  await expect(page.getByTestId('commerce-transport')).toBeVisible();
}

for (const transport of ['rest', 'graphql'] as const) {
  test(`${transport}: shopping, order history, cancellation and logout`, async ({ page, request }) => {
    // given
    const customer = await fixture(request);
    await login(page, customer.username, customer.password);
    if (transport === 'graphql') {
      await page.getByTestId('commerce-transport').selectOption('graphql');
      await expect(page.getByTestId('commerce-transport')).toHaveValue('graphql');
    }
    const commerceRequests: { path: string; query: string }[] = [];
    page.on('request', req => {
      const path = new URL(req.url()).pathname;
      if (/^\/api\/v1\/(graphql|products|cart|orders|admin\/inventory)(\/|$)/.test(path)) {
        commerceRequests.push({ path, query: req.postDataJSON()?.query ?? '' });
      }
    });
    // when
    await page.goto('/products');
    await expect(page.getByTestId('products-page')).toBeVisible();
    await page.goto(`/products/${customer.product.id}`);
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-item-count')).toHaveText('1');
    const beforeCart = commerceRequests.length;
    await page.getByTestId('desktop-cart-icon').click();
    await expect(page.getByTestId('cart-page')).toBeVisible();
    if (transport === 'graphql') {
      expect(commerceRequests.slice(beforeCart).filter(req => req.query.startsWith('query Product('))).toHaveLength(0);
    }
    await page.goto('/checkout');
    for (const [name, value] of Object.entries({ street: 'Main 1', city: 'Warsaw', state: 'Mazovia', zip: '00-001', country: 'Poland' })) {
      await page.getByTestId(`checkout-${name}-input`).fill(value);
    }
    await page.getByTestId('checkout-submit-button').click();
    await expect(page).toHaveURL(/\/orders\/\d+$/);
    const orderUrl = page.url();
    await expect(page.getByTestId('order-details-total-amount')).toHaveText('$19.99');
    await page.goto('/profile');
    await expect(page.getByText('Total: $19.99', { exact: true }).first()).toBeVisible();
    await page.goto(orderUrl);
    page.on('dialog', dialog => dialog.accept());
    await page.getByTestId('order-details-cancel-button').click();
    // then
    await expect(page.getByTestId('order-details-status')).toHaveText('CANCELLED');
    expect(commerceRequests.length).toBeGreaterThan(0);
    expect(commerceRequests.every(req => transport === 'graphql' ? req.path === '/api/v1/graphql' : req.path !== '/api/v1/graphql')).toBe(true);
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
}

test('switching protocols keeps the same server cart and refreshes an expired access token', async ({ page, request }) => {
  // given
  const customer = await fixture(request);
  await login(page, customer.username, customer.password);
  await page.goto(`/products/${customer.product.id}`);
  await page.getByTestId('add-to-cart').click();
  await expect(page.getByTestId('cart-item-count')).toHaveText('1');
  // when
  await page.getByTestId('commerce-transport').selectOption('graphql');
  await expect(page.getByTestId('commerce-transport')).toHaveValue('graphql');
  await page.evaluate(() => localStorage.setItem('token', 'expired.invalid.token'));
  const refresh = page.waitForResponse(response => response.url().endsWith('/api/v1/users/refresh') && response.ok());
  await page.goto('/cart');
  await refresh;
  // then
  await expect(page.getByTestId('cart-page')).toContainText(customer.product.name);
  await expect(page.getByTestId('cart-item-count')).toHaveText('1');
  await page.getByTestId('commerce-transport').selectOption('rest');
  await expect(page.getByTestId('commerce-transport')).toHaveValue('rest');
  await expect(page.getByTestId('cart-page')).toContainText(customer.product.name);
});

test('admin inventory reads and adjustments use GraphQL', async ({ page, request }) => {
  // given
  const { product } = await fixture(request);
  await login(page, 'admin', 'LocalDemoAdmin123!');
  await page.getByTestId('commerce-transport').selectOption('graphql');
  await expect(page.getByTestId('commerce-transport')).toHaveValue('graphql');
  // when
  await page.goto(`/admin/inventory/${product.id}`);
  await page.getByLabel('Quantity change').fill('3');
  await page.getByLabel('Reason', { exact: true }).fill('GraphQL browser test');
  const adjusted = page.waitForResponse(response => response.url().endsWith('/api/v1/graphql')
    && response.request().postDataJSON()?.query.startsWith('mutation AdjustInventory'));
  await page.getByRole('button', { name: 'Apply adjustment' }).click();
  // then
  const body = await (await adjusted).json();
  expect(body.errors).toBeUndefined();
  expect(body.data.adjustInventory.quantityAfter).toBe(13);
  await expect(page.getByText(/^GraphQL browser test ·/)).toBeVisible();
});

test('GraphQL execution errors show an error without REST fallback or logging the user out', async ({ page, request }) => {
  // given
  const customer = await fixture(request);
  await login(page, customer.username, customer.password);
  await page.getByTestId('commerce-transport').selectOption('graphql');
  await expect(page.getByTestId('commerce-transport')).toHaveValue('graphql');
  const restCommerce: string[] = [];
  page.on('request', req => {
    if (/\/api\/v1\/(cart|products|orders)(\/|$)/.test(new URL(req.url()).pathname)) restCommerce.push(req.url());
  });
  await page.route('**/api/v1/graphql', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ data: { cart: null }, errors: [{ message: 'Access denied', extensions: { code: 'FORBIDDEN' } }] }),
  }));
  // when
  await page.goto('/cart');
  // then
  await expect(page.getByTestId('cart-error')).toBeVisible();
  await expect(page.getByTestId('logout-button')).toBeVisible();
  expect(restCommerce).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('token'))).not.toBeNull();
});
