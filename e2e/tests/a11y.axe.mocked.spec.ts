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
});
