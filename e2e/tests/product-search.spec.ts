import { test, expect } from '../fixtures/auth.fixture';
import { ProductSearchPage } from '../pages/product-search.page.object';
import { productSearchMocks, type SearchItem } from '../mocks/productSearchMocks';

// 14 lamps (two pages of 12) and a few products in other categories.
const CATALOGUE: SearchItem[] = [
  ...Array.from({ length: 14 }, (_, index): SearchItem => ({
    id: index + 1,
    name: `Desk Lamp ${String(index + 1).padStart(2, '0')}`,
    description: 'Warm light for the desk',
    category: 'Lighting',
    price: 20 + index * 5,
    stockQuantity: index % 4 === 0 ? 0 : 5,
    averageRating: index % 2 === 0 ? 4.5 : null,
    reviewCount: index % 2 === 0 ? 3 : 0,
  })),
  { id: 100, name: 'Lamp Shade', description: 'Linen shade', category: 'Decor', price: 15, stockQuantity: 3, averageRating: 3.5, reviewCount: 1 },
  { id: 101, name: 'Oak Desk', description: 'Solid oak', category: 'Furniture', price: 450, stockQuantity: 1, averageRating: 5, reviewCount: 2 },
];

test.describe('Product search', () => {
  test('filters by text, category, price and stock and pages through results', async ({ authenticatedPage }) => {
    // given
    const { page } = authenticatedPage;
    const requests = await productSearchMocks.mockSearch(page, CATALOGUE);
    const searchPage = new ProductSearchPage(page);
    await searchPage.goto();
    await expect(searchPage.summary).toHaveText('Showing 1–12 of 16');

    // when
    await searchPage.searchInput.fill('lamp');
    // Router updates land asynchronously, so click and then wait for the checked state.
    await searchPage.categoryCheckbox('Lighting').click();
    await expect(searchPage.categoryCheckbox('Lighting')).toBeChecked();

    // then
    await expect(searchPage.summary).toHaveText('Showing 1–12 of 14');
    await expect(page.getByTestId('products-category-count-decor')).toHaveText('1');
    await expect(searchPage.productRatings.first()).toHaveText('★ 4.5 (3)');
    await expect(page).toHaveURL(/q=lamp/);
    await expect(page).toHaveURL(/category=Lighting/);

    // when
    await searchPage.nextPage.click();

    // then
    await expect(searchPage.pageStatus).toHaveText('Page 2 of 2');
    await expect(searchPage.productName).toHaveText(['Desk Lamp 13', 'Desk Lamp 14']);
    await expect(page).toHaveURL(/page=2/);

    // when
    await searchPage.setPriceRange('30', '60');
    await searchPage.inStockOnly.click();
    await expect(searchPage.inStockOnly).toBeChecked();
    await searchPage.sortBy('price-desc');

    // then: filters return to the first page and are sent to the backend
    await expect(searchPage.productPrice).toHaveText(['$55.00', '$50.00', '$45.00', '$35.00', '$30.00']);
    await expect(searchPage.pageStatus).toBeHidden();
    const last = requests[requests.length - 1].searchParams;
    expect(Object.fromEntries(last)).toEqual({
      q: 'lamp', category: 'Lighting', minPrice: '30', maxPrice: '60', inStock: 'true', sort: 'price_desc', page: '0', size: '12',
    });
  });

  test('keeps the search in a shareable link and shows backend validation inline', async ({ authenticatedPage }) => {
    // given
    const { page } = authenticatedPage;
    await productSearchMocks.mockSearch(page, CATALOGUE);
    const searchPage = new ProductSearchPage(page);

    // when
    await page.goto('/products?q=oak&minRating=4');

    // then
    await expect(searchPage.productName).toHaveText(['Oak Desk']);
    await expect(searchPage.searchInput).toHaveValue('oak');
    await expect(searchPage.minRating).toHaveValue('4');

    // when
    await searchPage.setPriceRange('100', '10');

    // then
    await expect(searchPage.validationErrors).toHaveText('minPrice: must not be greater than maxPrice');
    await expect(searchPage.minPrice).toHaveAttribute('aria-invalid', 'true');
  });

  test('shows an empty state that clears every filter', async ({ authenticatedPage }) => {
    // given
    const { page } = authenticatedPage;
    await productSearchMocks.mockSearch(page, CATALOGUE);
    const searchPage = new ProductSearchPage(page);
    await page.goto('/products?q=sofa');

    // when
    await expect(searchPage.noProductsMessage).toContainText('No products found');
    await page.getByTestId('reset-search-button').click();

    // then
    await expect(searchPage.summary).toHaveText('Showing 1–12 of 16');
    await expect(searchPage.searchInput).toHaveValue('');
  });
});
