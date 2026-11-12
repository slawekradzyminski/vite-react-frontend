import { test, expect } from '../fixtures/mocked-session.fixture';
import { fulfillWithSchema, type BackendSchema } from '../mocks/backendContract';
import { productSearchMocks } from '../mocks/productSearchMocks';
import { expectContainedIn, expectReachable } from '../utils/layout.utils';

const PHONE = { width: 360, height: 800 };

const product = (id: number, overrides: Partial<BackendSchema<'ProductDto'>> = {}): BackendSchema<'ProductDto'> => ({
  id,
  name: `Product ${id}`,
  description: 'A product',
  price: 19.99,
  stockQuantity: 5,
  category: 'Electronics',
  imageUrl: '',
  ...overrides,
});

const order = (id: number): BackendSchema<'OrderDto'> => ({
  id,
  username: 'a-customer-with-a-long-username',
  items: [],
  totalAmount: 120.5,
  status: 'PAID',
  shippingAddress: { street: 'Main 1', city: 'Warsaw', state: 'Mazowieckie', zipCode: '00-001', country: 'Poland' },
  createdAt: '2026-11-01T10:00:00Z',
  updatedAt: '2026-11-01T10:00:00Z',
});

// Layout regressions on narrow screens, checked against mocked data.
test.describe('Responsive layouts (mocked backend)', () => {
  test('admin product and order actions stay reachable on phones (T-058)', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    await page.setViewportSize(PHONE);
    await page.route('**/api/v1/products', (route) =>
      fulfillWithSchema(route, 'ProductDto', [product(1, { category: 'Very long category name for layout' })]));
    await page.route(/\/api\/v1\/orders\/admin(\?.*)?$/, (route) =>
      fulfillWithSchema(route, 'PageDtoOrderDto', { content: [order(42)], pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1 }));

    // when
    await page.goto('/admin/products');

    // then
    await expectReachable(page.getByTestId('admin-product-edit-1'));
    await expectReachable(page.getByTestId('admin-product-delete-1'));

    // when
    await page.goto('/admin/orders');

    // then
    await expectReachable(page.getByTestId('admin-order-details-42'));
    await page.getByTestId('admin-order-details-42').click();
    await expect(page).toHaveURL(/\/orders\/42$/);
  });

  test('a long category stays inside the product card and the category filter (T-059)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    await page.setViewportSize({ width: 1440, height: 900 });
    const longCategory = 'ProbeLongCategoryLongCategoryLongCategoryLong';
    const catalogue = [
      product(1, { name: 'Long lamp', category: longCategory }),
      product(2, { name: 'Book item', category: 'Books' }),
    ];
    await page.route('**/api/v1/products', (route) => fulfillWithSchema(route, 'ProductDto', catalogue));
    await productSearchMocks.mockSearch(page, catalogue.map((item) => ({ ...item, averageRating: null, reviewCount: 0 })));

    // when
    await page.goto('/products');

    // then
    const card = page.getByTestId('product-item').filter({ hasText: 'Long lamp' });
    await expect(card.getByTestId('product-category')).toHaveAttribute('title', longCategory);
    await expectContainedIn(card.getByTestId('product-category'), card);
    await expectContainedIn(page.getByTestId('products-category-item-probelongcategorylongcategorylongcategorylong'), page.getByTestId('products-categories-container'));
    await expectReachable(page.getByTestId('product-item').filter({ hasText: 'Book item' }).getByTestId('product-name-link'));
    await expectReachable(card.getByTestId('product-name-link'));
  });
});
