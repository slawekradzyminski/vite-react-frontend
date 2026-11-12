import { test, expect } from '../fixtures/mocked-session.fixture';
import { fulfillWithSchema, type BackendSchema } from '../mocks/backendContract';
import { expectReachable } from '../utils/layout.utils';

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
});
