import { test, expect } from '../fixtures/mocked-session.fixture';
import { fulfillWithSchema } from '../mocks/backendContract';
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
});
