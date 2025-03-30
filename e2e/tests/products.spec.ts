import { test, expect } from '../fixtures/auth.fixture';
import { ProductsPage } from '../pages/products.page.object';
import { productsMocks } from '../mocks/productMocks';

test.describe('Products Page', () => {
  let productsPage: ProductsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    productsPage = new ProductsPage(authenticatedPage.page);
  });

  test('should display product list', async ({ authenticatedPage }) => {
    //  given
    await productsMocks.mockGetProducts(authenticatedPage.page);

    //  when
    await productsPage.goto();

    //  then
    await expect(productsPage.productList).toBeVisible();
    const productNames = await productsPage.getAllProductNames();
    expect(productNames).toEqual(['Product A', 'Product B', 'Product C', 'Product D']);
  });

  test('should allow searching for products', async ({ authenticatedPage }) => {
    //  given
    const searchTerm = 'Product A';
    await productsMocks.mockGetProducts(authenticatedPage.page);
    await productsPage.goto();

    //  when
    await productsPage.searchForProduct(searchTerm);

    //  then
    const productNames = await productsPage.getAllProductNames();
    expect(productNames).toEqual(['Product A']);
  });

  test('should filter products by category', async ({ authenticatedPage }) => {
    //  given
    const category = 'Tech';
    await productsMocks.mockGetProducts(authenticatedPage.page);
    await productsPage.goto();

    //  when
    await productsPage.filterByCategory(category);

    //  then
    const productCategories = await productsPage.getAllProductCategories();
    expect(productCategories.every(cat => cat === category)).toBeTruthy();
  });

  test('should sort products by price ascending', async ({ authenticatedPage }) => {
    //  given
    await productsMocks.mockGetProducts(authenticatedPage.page);
    await productsPage.goto();
    const sortOrder = 'price-asc';

    //  when
    await productsPage.sortBy(sortOrder);

    //  then
    const prices = await productsPage.getAllProductPrices();
    expect(prices).toEqual(prices.slice().sort((a, b) => a - b));
  });

  test('should sort products by price descending', async ({ authenticatedPage }) => {
    //  given
    const sortOrder = 'price-desc';
    await productsMocks.mockGetProducts(authenticatedPage.page);
    await productsPage.goto();

    //  when
    await productsPage.sortBy(sortOrder);

    //  then
    const prices = await productsPage.getAllProductPrices();
    expect(prices).toEqual(prices.slice().sort((a, b) => b - a));
  });

  test('should display message when no products are found', async ({ authenticatedPage }) => {
    //  given
    await productsMocks.mockEmptyProducts(authenticatedPage.page);

    //  when
    await productsPage.goto();

    //  then
    await expect(productsPage.noProductsMessage).toBeVisible();
  });

});
