import { test, expect, decode } from './shop.fixture';
import type { Cart } from '../../src/types/cart';
import type { Product } from '../../src/types/product';

test('discovers three native tools with meaningful schemas', async ({ shop }) => {
  // given
  await shop.open();

  // when
  const tools = await shop.page.webmcp.tools();

  // then
  expect(tools.map(tool => tool.name).sort()).toEqual(['add_to_cart', 'get_cart', 'search_products']);
  expect(tools.find(tool => tool.name === 'add_to_cart')?.inputSchema).toMatchObject({ required: ['productId', 'quantity'], additionalProperties: false });
  expect(tools.find(tool => tool.name === 'get_cart')?.annotations?.readOnly).toBe(true);
});

test('searches the real catalogue and updates the visible filters', async ({ shop }) => {
  // given
  await shop.open();

  // when
  const result = await shop.page.webmcp.callTool('search_products', { query: shop.namespace, inStockOnly: true });

  // then
  expect(decode<Product[]>(result).map(product => product.id)).toEqual([shop.cheap.id, shop.expensive.id]);
  await expect(shop.page.getByTestId('webmcp-search')).toHaveValue(shop.namespace);
  await expect(shop.page.getByRole('checkbox', { name: 'In stock only' })).toBeChecked();
  await expect(shop.page.getByTestId(`webmcp-product-${shop.unavailable.id}`)).toHaveCount(0);
});

test('adds through WebMCP and agrees with the UI and independent backend read', async ({ shop }) => {
  // given
  await shop.open();

  // when
  const result = await shop.page.webmcp.callTool('add_to_cart', { productId: shop.cheap.id, quantity: 2 });

  // then
  expect(decode<Cart>(result)).toMatchObject({ username: shop.username, totalItems: 2, totalPrice: 25, items: [{ productId: shop.cheap.id, quantity: 2 }] });
  expect(await shop.saved()).toMatchObject({ totalItems: 2, totalPrice: 25, items: [{ productId: shop.cheap.id, quantity: 2 }] });
  await expect(shop.page.getByTestId('webmcp-cart-count')).toHaveText('2');
  await expect(shop.page.getByTestId('webmcp-cart-total')).toHaveText('$25.00');
});

test('the UI baseline writes the same cart with native tools disabled', async ({ shop }) => {
  // given
  await shop.open({ tools: 'off' });
  expect(await shop.page.webmcp.tools()).toEqual([]);

  // when
  await shop.page.getByTestId(`webmcp-quantity-${shop.cheap.id}`).fill('2');
  await shop.page.getByTestId(`webmcp-add-${shop.cheap.id}`).click();

  // then
  await expect(shop.page.getByTestId('webmcp-cart-total')).toHaveText('$25.00');
  expect(await shop.saved()).toMatchObject({ totalItems: 2, totalPrice: 25, items: [{ productId: shop.cheap.id, quantity: 2 }] });
});

test('repeated successful add calls add units rather than replacing the quantity', async ({ shop }) => {
  // given
  await shop.open();
  await shop.page.webmcp.callTool('add_to_cart', { productId: shop.cheap.id, quantity: 2 });

  // when
  const result = await shop.page.webmcp.callTool('add_to_cart', { productId: shop.cheap.id, quantity: 1 });

  // then
  expect(decode<Cart>(result)).toMatchObject({ totalItems: 3, totalPrice: 37.5 });
  expect(await shop.saved()).toMatchObject({ items: [{ productId: shop.cheap.id, quantity: 3 }] });
});

test('stock rejection preserves a previously populated cart', async ({ shop }) => {
  // given
  await shop.open();
  await shop.page.webmcp.callTool('add_to_cart', { productId: shop.cheap.id, quantity: 2 });
  const before = await shop.saved();

  // when
  const result = await shop.page.webmcp.callTool('add_to_cart', { productId: shop.unavailable.id, quantity: 1 });

  // then
  expect(result.isError).toBe(true);
  expect(await shop.saved()).toEqual(before);
  await expect(shop.page.getByTestId('webmcp-cart-total')).toHaveText('$25.00');
});

test('unknown product rejection preserves the cart', async ({ shop }) => {
  // given
  await shop.open();

  // when
  const result = await shop.page.webmcp.callTool('add_to_cart', { productId: 2147483647, quantity: 1 });

  // then
  expect(result.isError).toBe(true);
  expect(await shop.saved()).toMatchObject({ totalItems: 0, items: [] });
});

test('cart reads stay scoped to the authenticated user', async ({ shop, browser }) => {
  // given
  await shop.open();
  const anonymous = await browser.newContext();

  // when
  const result = await shop.page.webmcp.callTool('get_cart', {});
  const anonymousPage = await anonymous.newPage();
  await anonymousPage.goto('http://localhost:5180/webmcp');

  // then
  expect(decode<Cart>(result).username).toBe(shop.username);
  await expect(anonymousPage).toHaveURL(/\/login$/);
  expect(await anonymousPage.webmcp.tools()).toEqual([]);
  await anonymous.close();
});

test('tools are unregistered when the React route is left', async ({ shop }) => {
  // given
  await shop.open();

  // when
  await shop.page.getByRole('link', { name: 'Demo Shopper' }).click();

  // then
  await expect(shop.page).toHaveURL(/\/profile$/);
  await expect.poll(async () => shop.page.webmcp.tools()).toEqual([]);
});

test('broken button leaves the human path broken while WebMCP succeeds', async ({ shop }) => {
  // given
  await shop.open({ fault: 'broken-button' });

  // when
  await shop.page.getByTestId(`webmcp-quantity-${shop.cheap.id}`).fill('2');
  await shop.page.getByTestId(`webmcp-add-${shop.cheap.id}`).click();
  expect(await shop.saved()).toMatchObject({ totalItems: 0 });
  await expect(shop.page.getByTestId('webmcp-cart-total')).toHaveText('$0.00');
  const result = await shop.page.webmcp.callTool('add_to_cart', { productId: shop.cheap.id, quantity: 2 });

  // then
  expect(decode<Cart>(result).totalPrice).toBe(25);
  expect(await shop.saved()).toMatchObject({ totalItems: 2, totalPrice: 25 });
  await expect(shop.page.getByTestId('webmcp-cart-total')).toHaveText('$25.00');
});

test('wrong-product fault is observable in an independent backend read', async ({ shop }) => {
  // given
  await shop.open({ fault: 'wrong-product' });

  // when
  const result = await shop.page.webmcp.callTool('add_to_cart', { productId: shop.cheap.id, quantity: 2 });

  // then
  expect(decode<Cart>(result).items).toEqual([{ productId: shop.expensive.id, quantity: 2 }]);
  expect(await shop.saved()).toMatchObject({ totalPrice: 50, items: [{ productId: shop.expensive.id, quantity: 2 }] });
  await expect(shop.page.getByTestId(`webmcp-cart-item-${shop.cheap.id}`)).toHaveCount(0);
});

test('stale-cart fault separates tool success from visible state', async ({ shop }) => {
  // given
  await shop.open({ fault: 'stale-cart' });

  // when
  const result = await shop.page.webmcp.callTool('add_to_cart', { productId: shop.cheap.id, quantity: 2 });

  // then
  expect(decode<Cart>(result)).toMatchObject({ totalItems: 2, totalPrice: 25 });
  expect(await shop.saved()).toMatchObject({ totalItems: 2, totalPrice: 25 });
  await expect(shop.page.getByTestId('webmcp-cart-total')).toHaveText('$0.00');
});

test('wrong displayed total disagrees with saved data', async ({ shop }) => {
  // given
  await shop.open({ fault: 'wrong-total' });

  // when
  const result = await shop.page.webmcp.callTool('add_to_cart', { productId: shop.cheap.id, quantity: 2 });

  // then
  expect(decode<Cart>(result).totalPrice).toBe(25);
  expect((await shop.saved()).totalPrice).toBe(25);
  await expect(shop.page.getByTestId('webmcp-cart-total')).toHaveText('$25.01');
});

test('scenario switching replaces tool closures without duplicate registrations', async ({ shop }) => {
  // given
  await shop.open({ fault: 'stale-cart' });

  // when
  await shop.page.getByTestId('webmcp-fault').selectOption('none');
  await expect(shop.page.getByTestId('webmcp-status')).toHaveText('3 native WebMCP tools registered');
  await shop.page.webmcp.callTool('add_to_cart', { productId: shop.cheap.id, quantity: 2 });

  // then
  expect(await shop.page.webmcp.tools()).toHaveLength(3);
  await expect(shop.page.getByTestId('webmcp-cart-total')).toHaveText('$25.00');
});

test('small screens remain usable without horizontal overflow', async ({ shop }) => {
  // given
  await shop.page.setViewportSize({ width: 390, height: 844 });
  await shop.open();

  // when
  await shop.page.getByTestId(`webmcp-add-${shop.cheap.id}`).click();

  // then
  await expect(shop.page.getByTestId('webmcp-cart-total')).toHaveText('$12.50');
  expect(await shop.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('original products page shares search, stock filtering and cart state with tools', async ({ shop }) => {
  await shop.page.goto('/products?inspect=1');
  await expect(shop.page.getByTestId('shop-tool-status')).toHaveText('3 native WebMCP tools registered');
  await shop.page.getByTestId(`products-category-${shop.namespace.toLowerCase()}`).click();
  const result = await shop.page.webmcp.callTool('search_products', { query: `  ${shop.namespace}  `, inStockOnly: true });
  expect(decode<Product[]>(result).map(product => product.id)).toEqual([shop.cheap.id, shop.expensive.id]);
  await expect(shop.page.getByTestId('product-search')).toHaveValue(`  ${shop.namespace}  `);
  await expect(shop.page.getByTestId('product-sort')).toHaveValue('price-asc');
  await expect(shop.page.getByTestId('product-in-stock-only')).toBeChecked();
  await expect(shop.page.getByTestId('product-list-title')).toHaveText('All Products');
  await expect(shop.page.getByTestId('product-name')).toHaveText([shop.cheap.name, shop.expensive.name]);
  await shop.page.webmcp.callTool('add_to_cart', { productId: shop.cheap.id, quantity: 2 });
  const card = shop.page.getByTestId('product-item').filter({ has: shop.page.getByTestId('product-name').filter({ hasText: shop.cheap.name }) });
  await expect(card.getByTestId('product-card-cart-quantity')).toHaveText('2 in cart');
  await expect(card.getByTestId('product-quantity-value')).toHaveText('2');
  expect(await shop.saved()).toMatchObject({ totalPrice: 25, totalItems: 2 });
  await shop.page.getByTestId('username-profile-link').click();
  await expect(shop.page).toHaveURL(/\/profile$/);
  await expect.poll(async () => shop.page.webmcp.tools()).toEqual([]);
});

test('get_cart refreshes original product cards from a fresh backend read', async ({ shop }) => {
  await shop.page.goto('/products?inspect=1');
  await expect(shop.page.getByTestId('shop-tool-status')).toHaveText('3 native WebMCP tools registered');
  await shop.page.webmcp.callTool('search_products', { query: shop.cheap.name });
  await expect(shop.page.getByTestId('product-card-cart-quantity')).toHaveCount(0);
  await shop.saveOutsidePage(shop.cheap.id, 2);
  const result = await shop.page.webmcp.callTool('get_cart', {});
  expect(decode<Cart>(result)).toMatchObject({ totalPrice: 25, totalItems: 2 });
  await expect(shop.page.getByTestId('product-card-cart-quantity')).toHaveText('2 in cart');
});

test('original products UI works with page tools deliberately disabled', async ({ shop }) => {
  await shop.page.goto('/products?tools=off&inspect=1');
  await expect(shop.page.getByTestId('shop-tool-status')).toHaveText('Tools disabled for the UI baseline');
  expect(await shop.page.webmcp.tools()).toEqual([]);
  await shop.page.getByTestId('product-search').fill(shop.cheap.name);
  await shop.page.getByTestId('product-increase-quantity').click();
  await shop.page.getByTestId('product-add-button').click();
  await expect(shop.page.getByTestId('product-card-cart-quantity')).toHaveText('2 in cart');
  expect(await shop.saved()).toMatchObject({ totalItems: 2, totalPrice: 25 });
});

test('original shop inspector fits a small screen', async ({ shop }) => {
  await shop.page.setViewportSize({ width: 390, height: 844 });
  await shop.page.goto('/products?inspect=1');
  await expect(shop.page.getByTestId('shop-tool-status')).toHaveText('3 native WebMCP tools registered');
  await shop.page.webmcp.callTool('search_products', { query: shop.namespace });
  await shop.page.locator('summary').filter({ hasText: 'add_to_cart' }).click();
  expect(await shop.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
