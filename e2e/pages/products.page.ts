import { Page, Locator } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly productList: Locator;
  readonly productItem: Locator;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly productCategory: Locator;
  readonly searchInput: Locator;
  readonly sortDropdown: Locator;
  readonly categoryFilter: Locator;
  readonly noProductsMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productList = page.locator('[data-testid="product-list"]');
    this.productItem = page.locator('[data-testid="product-item"]');
    this.productName = page.locator('[data-testid="product-name"]');
    this.productPrice = page.locator('[data-testid="product-price"]');
    this.productCategory = page.locator('[data-testid="product-category"]');
    this.searchInput = page.locator('[data-testid="product-search"]');
    this.sortDropdown = page.locator('[data-testid="product-sort"]');
    this.categoryFilter = page.locator('[data-testid="product-filter-category"]');
    this.noProductsMessage = page.locator('[data-testid="no-products-message"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/products');
  }

  async searchForProduct(name: string) {
    await this.searchInput.fill(name);
    await this.searchInput.press('Enter');
  }

  async getAllProductNames() {
    return this.productName.allTextContents();
  }

  async getAllProductPrices() {
    const priceTexts = await this.productPrice.allTextContents();
    return priceTexts.map(price => {
      const match = price.match(/\d+(\.\d+)?/);
      return match ? parseFloat(match[0]) : 0;
    });
  }

  async getAllProductCategories() {
    return this.productCategory.allTextContents();
  }

  async sortBy(option: string) {
    await this.sortDropdown.selectOption(option);
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.locator(`button:has-text("${category}")`).click();
  }

  async isNoProductsMessageVisible() {
    return this.noProductsMessage.isVisible();
  }

  async isErrorMessageVisible() {
    return this.errorMessage.isVisible();
  }

  async getProductCount() {
    return this.productItem.count();
  }
} 