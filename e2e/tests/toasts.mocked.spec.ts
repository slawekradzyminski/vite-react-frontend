import { test, expect } from '../fixtures/mocked-session.fixture';
import { fulfillWithSchema, type BackendSchema } from '../mocks/backendContract';

const created: BackendSchema<'ProductDto'> = {
  id: 77,
  name: 'Toast lamp',
  description: 'A lamp for toast checks',
  price: 12.5,
  stockQuantity: 3,
  category: 'Home',
  imageUrl: '',
};

// Toasts live outside the routed page, so one raised right before a navigation stays visible.
test.describe('Toasts across navigation (mocked backend)', () => {
  test('saving a new product shows its confirmation on the product list', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    const catalogue: BackendSchema<'ProductDto'>[] = [];
    await page.route('**/api/v1/products', (route) => {
      if (route.request().method() === 'POST') {
        catalogue.push(created);
        return fulfillWithSchema(route, 'ProductDto', created, 201);
      }
      return fulfillWithSchema(route, 'ProductDto', catalogue);
    });
    await page.goto('/admin/products/new');
    await page.getByTestId('product-name-input').fill('Toast lamp');
    await page.getByTestId('product-description-input').fill('A lamp for toast checks');
    await page.getByTestId('product-price-input').fill('12.5');
    await page.getByTestId('product-stock-input').fill('3');
    await page.getByTestId('product-category-input').fill('Home');

    // when
    await page.getByTestId('product-submit-button').click();

    // then
    await expect(page).toHaveURL((url) => url.pathname === '/admin/products');
    await expect(page.getByTestId('admin-products-page')).toBeVisible();
    await expect(page.getByTestId('toast-title')).toHaveText('Product created');
    await expect(page.getByTestId('toast-description')).toHaveText('The product is now in the catalogue.');
  });

  test('a toast stays while the user moves on to another page', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    await page.route('**/api/v1/products', (route) =>
      route.request().method() === 'POST'
        ? fulfillWithSchema(route, 'ProductDto', created, 201)
        : fulfillWithSchema(route, 'ProductDto', [created]));
    await page.goto('/admin/products/new');
    await page.getByTestId('product-name-input').fill('Toast lamp');
    await page.getByTestId('product-description-input').fill('A lamp for toast checks');
    await page.getByTestId('product-price-input').fill('12.5');
    await page.getByTestId('product-stock-input').fill('3');
    await page.getByTestId('product-category-input').fill('Home');
    await page.getByTestId('product-submit-button').click();
    await expect(page.getByTestId('toast-title')).toHaveText('Product created');

    // when
    await page.getByTestId('desktop-menu-products').click();

    // then
    await expect(page).toHaveURL((url) => url.pathname === '/products');
    await expect(page.getByTestId('products-page')).toBeVisible();
    await expect(page.getByTestId('admin-products-page')).toBeHidden();
    await expect(page.getByTestId('toast-title')).toHaveText('Product created');
  });
});
