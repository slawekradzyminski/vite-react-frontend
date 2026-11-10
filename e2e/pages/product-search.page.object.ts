import { Locator, Page } from '@playwright/test';
import { ProductsPage } from './products.page.object';

/** Server-side search controls of the REST catalogue. */
export class ProductSearchPage extends ProductsPage {
  readonly minPrice: Locator;
  readonly maxPrice: Locator;
  readonly applyPrice: Locator;
  readonly minRating: Locator;
  readonly inStockOnly: Locator;
  readonly summary: Locator;
  readonly nextPage: Locator;
  readonly previousPage: Locator;
  readonly pageStatus: Locator;
  readonly validationErrors: Locator;
  readonly productRatings: Locator;

  constructor(page: Page) {
    super(page);
    this.minPrice = page.getByLabel('Min');
    this.maxPrice = page.getByLabel('Max');
    this.applyPrice = page.getByTestId('product-price-apply');
    this.minRating = page.getByLabel('Customer rating');
    this.inStockOnly = page.getByRole('checkbox', { name: 'In stock only' });
    this.summary = page.getByTestId('product-search-summary');
    this.nextPage = page.getByTestId('product-pagination-next');
    this.previousPage = page.getByTestId('product-pagination-prev');
    this.pageStatus = page.getByTestId('product-pagination-status');
    this.validationErrors = page.getByTestId('product-search-errors');
    this.productRatings = page.getByTestId('product-rating');
  }

  categoryCheckbox(category: string) {
    return this.categoryFilter.getByRole('checkbox', { name: category });
  }

  async setPriceRange(min: string, max: string) {
    await this.minPrice.fill(min);
    await this.maxPrice.fill(max);
    await this.applyPrice.click();
  }
}
