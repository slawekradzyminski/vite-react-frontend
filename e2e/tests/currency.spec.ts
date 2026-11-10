import { test, expect } from '../fixtures/auth.fixture';
import { ProductSearchPage } from '../pages/product-search.page.object';
import { productSearchMocks } from '../mocks/productSearchMocks';
import { currencyMocks } from '../mocks/currencyMocks';

test.describe('Display currency', () => {
  test('switching the currency converts prices and survives a reload', async ({ authenticatedPage }) => {
    // given
    const { page } = authenticatedPage;
    await currencyMocks.mockCurrencies(page);
    await productSearchMocks.mockSearch(page, [
      { id: 1, name: 'Headphones', category: 'Audio', price: 100, stockQuantity: 3, averageRating: null, reviewCount: 0 },
      { id: 2, name: 'Cable', category: 'Audio', price: 19.99, stockQuantity: 9, averageRating: null, reviewCount: 0 },
    ]);
    const productsPage = new ProductSearchPage(page);
    await productsPage.goto();
    await expect(productsPage.productPrice).toHaveText(['$100.00', '$19.99']);
    const selector = page.getByRole('combobox', { name: 'Display currency' });

    // when
    await selector.selectOption('EUR');

    // then
    await expect(productsPage.productPrice).toHaveText(['€92.59', '€18.51']);

    // when
    await selector.selectOption('PLN');

    // then
    await expect(productsPage.productPrice).toHaveText(['400.00 zł', '79.96 zł']);

    // when
    await page.reload();

    // then
    await expect(selector).toHaveValue('PLN');
    await expect(productsPage.productPrice).toHaveText(['400.00 zł', '79.96 zł']);
  });
});
