import { test, expect } from '../fixtures/mocked-session.fixture';
import { eventStream, fulfillWithSchema } from '../mocks/backendContract';
import { cartMocks } from '../mocks/cartMocks';
import { productSearchMocks } from '../mocks/productSearchMocks';
import { expectNoAxeViolations } from '../utils/axe.utils';

// axe-core scans (WCAG 2.1 AA + best practices) of the pages whose accessibility defects were
// fixed in 3.13.0. Every API call is mocked, so the scans see stable content.
test.describe('Axe accessibility scans (mocked backend)', () => {
  test('checkout validation errors meet the contrast minimum (T-049)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    await cartMocks.mockCartWithItems(page);
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-form')).toBeVisible();

    // when
    await page.getByTestId('checkout-submit-button').click();

    // then
    await expect(page.getByTestId('checkout-street-error')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('the "No image available" placeholder meets the contrast minimum (T-050)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    const product = { id: 7, name: 'Imageless Lamp', price: 25, category: 'Home', description: 'No photo yet', imageUrl: '' };
    await page.route('**/api/v1/products', (route) => fulfillWithSchema(route, 'ProductDto', [product]));
    await productSearchMocks.mockSearch(page, [{ ...product, stockQuantity: 4, averageRating: null, reviewCount: 0 }]);
    await page.route('**/api/v1/products/7', (route) => fulfillWithSchema(route, 'ProductDto', { ...product, stockQuantity: 4 }));

    // when
    await page.goto('/products');

    // then
    await expect(page.getByTestId('product-no-image')).toBeVisible();
    await expectNoAxeViolations(page);

    // when
    await page.goto('/products/7');

    // then
    await expect(page.getByTestId('product-no-image')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('admin product and order lists scroll sideways with the keyboard on phones (T-058)', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    await page.setViewportSize({ width: 360, height: 800 });
    await page.route('**/api/v1/products', (route) => fulfillWithSchema(route, 'ProductDto', [
      { id: 1, name: 'Desk Lamp', price: 25, category: 'Home', description: 'A lamp', imageUrl: '/images/lamp.jpg', stockQuantity: 4 },
    ]));
    await page.route(/\/api\/v1\/orders\/admin(\?.*)?$/, (route) => fulfillWithSchema(route, 'PageDtoOrderDto', {
      content: [{
        id: 42, username: 'client', items: [], totalAmount: 25, status: 'PAID', createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-01T10:00:00Z',
        shippingAddress: { street: 'Main 1', city: 'Warsaw', state: 'Mazowieckie', zipCode: '00-001', country: 'Poland' },
      }],
      pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1,
    }));

    // when
    await page.goto('/admin/products');

    // then
    await expect(page.getByTestId('admin-product-row-1')).toBeVisible();
    await expectNoAxeViolations(page);

    // when
    await page.goto('/admin/orders');

    // then
    await expect(page.getByTestId('admin-order-row-42')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('admin product form shows required-field and API errors accessibly (T-063)', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    await page.route('**/api/v1/products', (route) => fulfillWithSchema(route, 'ErrorDto', { message: 'Internal server error' }, 500));
    await page.goto('/admin/products/new');
    await page.getByTestId('product-name-input').fill('Desk Lamp');
    await page.getByTestId('product-price-input').fill('25');
    await page.getByTestId('product-stock-input').fill('4');
    await page.getByTestId('product-category-input').fill('Home');

    // when
    await page.getByTestId('product-submit-button').click();

    // then
    await expect(page.getByTestId('product-description-error')).toHaveText('Product description is required');
    await expectNoAxeViolations(page);

    // when
    await page.getByTestId('product-description-input').fill('A lamp');
    await page.getByTestId('product-submit-button').click();

    // then
    await expect(page.getByTestId('product-form-error')).toHaveText('Internal server error');
    await expectNoAxeViolations(page);
  });

  test('a failed cart read is announced on product pages (T-065)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    const product = { id: 7, name: 'Desk Lamp', price: 25, category: 'Home', description: 'A lamp', imageUrl: '', stockQuantity: 4 };
    await page.route('**/api/v1/cart', (route) => fulfillWithSchema(route, 'ErrorDto', { message: 'Internal server error' }, 500));
    await page.route('**/api/v1/products', (route) => fulfillWithSchema(route, 'ProductDto', [product]));
    await productSearchMocks.mockSearch(page, [{ ...product, averageRating: null, reviewCount: 0 }]);
    await page.route('**/api/v1/products/7', (route) => fulfillWithSchema(route, 'ProductDto', product));

    // when
    await page.goto('/products/7');

    // then
    await expect(page.getByTestId('product-cart-unavailable')).toBeVisible();
    await expect(page.getByTestId('add-to-cart')).toBeDisabled();
    await expectNoAxeViolations(page);

    // when
    await page.goto('/products');

    // then
    await expect(page.getByTestId('product-cart-unavailable')).toBeVisible();
    await expect(page.getByTestId('product-add-button')).toBeDisabled();
    await expectNoAxeViolations(page);
  });

  test('admin coupons page (T-068)', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    await page.route(/\/api\/v1\/admin\/coupons(\?.*)?$/, (route) => fulfillWithSchema(route, 'PageDtoCouponDto', {
      content: [{
        id: 5, code: 'WINTER10', description: 'Winter sale', type: 'PERCENTAGE', value: 10, minOrderAmount: null,
        validFrom: '2026-11-12T09:00:00', validUntil: '2026-11-30T22:30:00', maxRedemptions: null, perUserLimit: 1,
        redemptionCount: 0, active: true, status: 'ACTIVE', createdAt: '2026-11-01T10:00:00', updatedAt: '2026-11-01T10:00:00',
      }],
      pageNumber: 0, pageSize: 50, totalElements: 1, totalPages: 1,
    }));

    // when
    await page.goto('/admin/coupons');
    await page.getByTestId('coupon-edit-5').click();

    // then
    await expect(page.getByTestId('coupon-valid-from')).not.toHaveValue('');
    await expectNoAxeViolations(page);
  });

  test('cart page as stacked rows on phones and as a table on desktop (T-061)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    await cartMocks.mockCartWithItems(page);
    await page.setViewportSize({ width: 393, height: 852 });

    // when
    await page.goto('/cart');

    // then
    await expect(page.getByTestId('cart-item-remove-1')).toBeVisible();
    await expectNoAxeViolations(page);

    // when
    await page.setViewportSize({ width: 1280, height: 900 });

    // then
    await expect(page.getByTestId('cart-item-remove-1')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('catalog filters folded on phones and open on desktop (T-062)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    const product = { id: 7, name: 'Desk Lamp', price: 25, category: 'Home', description: 'A lamp', imageUrl: '', stockQuantity: 4 };
    await page.route('**/api/v1/products', (route) => fulfillWithSchema(route, 'ProductDto', [product]));
    await productSearchMocks.mockSearch(page, [{ ...product, averageRating: null, reviewCount: 0 }]);
    await page.setViewportSize({ width: 360, height: 800 });

    // when
    await page.goto('/products');

    // then
    await expect(page.getByTestId('products-filters-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expectNoAxeViolations(page);

    // when
    await page.getByTestId('products-filters-toggle').click();

    // then
    await expect(page.getByTestId('products-category-home')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('QR page with its byte counter and a too-long text (T-037)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    await page.goto('/qr');
    await page.getByTestId('qr-text-input').fill('a'.repeat(2954));

    // when
    await page.getByTestId('qr-generate-button').click();

    // then
    await expect(page.getByTestId('qr-text-error')).toContainText('Text is too long for a QR code');
    await expect(page.getByTestId('qr-text-byte-count')).toHaveText('2,954 / 2,953 bytes');
    await expectNoAxeViolations(page);
  });

  for (const path of ['/llm/generate', '/llm/chat', '/llm/tools']) {
    test(`${path} with the settings panel collapsed (T-044)`, async ({ mockedClient }) => {
      // given
      const { page } = mockedClient;

      // when
      await page.goto(path);

      // then
      await expect(page.locator('[inert][aria-hidden="true"]')).toHaveCount(1);
      await expectNoAxeViolations(page);
    });
  }

  test('admin inventory with a selected product (T-047)', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    const item = { productId: 7, name: 'Desk Lamp', category: 'Home', availableQuantity: 4, stockStatus: 'LOW_STOCK' as const, lastChangedAt: '2026-11-01T10:00:00Z' };
    await page.route(/\/api\/v1\/admin\/inventory(\?.*)?$/, (route) => fulfillWithSchema(route, 'PageDtoInventoryItemDto', {
      content: [item], pageNumber: 0, pageSize: 20, totalElements: 1, totalPages: 1,
    }));
    await page.route(/\/api\/v1\/admin\/inventory\/7(\?.*)?$/, (route) => fulfillWithSchema(route, 'InventoryItemDto', item));
    await page.route(/\/api\/v1\/admin\/inventory\/7\/movements(\?.*)?$/, (route) => fulfillWithSchema(route, 'PageDtoInventoryMovementDto', {
      content: [], pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0,
    }));
    await page.goto('/admin/inventory');

    // when
    await page.getByTestId('inventory-row-link-7').focus();
    await page.keyboard.press('Enter');

    // then
    await expect(page).toHaveURL(/\/admin\/inventory\/7$/);
    await expect(page.getByTestId('inventory-selected-name')).toHaveText('Desk Lamp');
    await expectNoAxeViolations(page);
  });

  test('order details for an administrator, and a missing order (T-048, T-064)', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    await page.route('**/api/v1/orders/42', (route) => fulfillWithSchema(route, 'OrderDto', {
      id: 42, username: 'client', items: [{ id: 1, productId: 7, productName: 'Desk Lamp', quantity: 1, unitPrice: 25, totalPrice: 25 }],
      totalAmount: 25, status: 'PAID', createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-01T10:00:00Z',
      shippingAddress: { street: 'Main 1', city: 'Warsaw', state: 'Mazowieckie', zipCode: '00-001', country: 'Poland' },
    }));

    // when
    await page.goto('/orders/42');

    // then
    await expect(page.getByRole('combobox', { name: 'Order status' })).toBeVisible();
    await expectNoAxeViolations(page);

    // when
    await page.goto('/orders/9223372036854775807');

    // then
    await expect(page.getByTestId('order-details-not-found')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('register page with a filled form (T-001)', async ({ page }) => {
    // given
    await page.goto('/register');

    // when
    await page.getByTestId('register-username-input').fill('new-user');

    // then
    await expectNoAxeViolations(page);
  });

  test('open mobile menu (T-060)', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    await page.setViewportSize({ width: 390, height: 560 });
    await page.goto('/');

    // when
    await page.getByTestId('mobile-menu-toggle').click();

    // then
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('chat and tool chat conversations on a phone (T-043, T-045, T-046)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    await page.setViewportSize({ width: 360, height: 800 });
    await page.route('**/api/v1/ollama/chat', (route) => route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: eventStream('ChatResponseDto', [{ message: { role: 'assistant', content: 'The mock is ready.' }, done: true }]),
    }));
    await page.route('**/api/v1/ollama/chat/tools', (route) => route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: eventStream('ChatResponseDto', [
        { message: { role: 'assistant', content: '', tool_calls: [{ function: { name: 'list_products', arguments: { category: 'beauty', inStockOnly: true } } }] }, done: true },
        { message: { role: 'tool', tool_name: 'list_products', content: '{"products":[],"total":0}' }, done: false },
        { message: { role: 'assistant', content: 'No Beauty products yet.' }, done: true },
      ]),
    }));

    // when
    await page.goto('/llm/chat');
    await page.getByTestId('chat-input').fill('Give me a quick status update');
    await page.getByTestId('chat-send-button').click();

    // then
    await expect(page.getByTestId('chat-message-content-assistant')).toHaveText('The mock is ready.');
    await expect(page.getByTestId('chat-input')).toBeEnabled();
    await expectNoAxeViolations(page);

    // when
    await page.goto('/llm/tools');
    await page.getByTestId('chat-input').fill('What Beauty products do we have available?');
    await page.getByTestId('chat-send-button').click();

    // then
    await expect(page.getByTestId('chat-message-content-assistant')).toHaveText('No Beauty products yet.');
    await expect(page.getByTestId('chat-input')).toBeEnabled();
    await expectNoAxeViolations(page);
  });
});
