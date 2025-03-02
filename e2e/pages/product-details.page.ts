import { Page, Locator } from '@playwright/test';

export class ProductDetailsPage {
  readonly page: Page;
  readonly productDetails: Locator;
  readonly productTitle: Locator;
  readonly productDescription: Locator;
  readonly productPrice: Locator;
  readonly productCategory: Locator;
  readonly productStock: Locator;
  readonly productCartQuantity: Locator;
  readonly productImage: Locator;
  readonly productNoImage: Locator;
  readonly addToCartButton: Locator;
  readonly removeFromCartButton: Locator;
  readonly decreaseQuantityButton: Locator;
  readonly increaseQuantityButton: Locator;
  readonly quantityValue: Locator;
  readonly notFoundMessage: Locator;
  readonly loadingMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productDetails = page.locator('[data-testid="product-details"]');
    this.productTitle = page.locator('[data-testid="product-title"]');
    this.productDescription = page.locator('[data-testid="product-description"]');
    this.productPrice = page.locator('[data-testid="product-price"]');
    this.productCategory = page.locator('[data-testid="product-category"]');
    this.productStock = page.locator('[data-testid="product-stock"]');
    this.productCartQuantity = page.locator('[data-testid="product-cart-quantity"]');
    this.productImage = page.locator('[data-testid="product-image"]');
    this.productNoImage = page.locator('[data-testid="product-no-image"]');
    this.addToCartButton = page.locator('[data-testid="add-to-cart"]');
    this.removeFromCartButton = page.locator('[data-testid="remove-from-cart"]');
    this.decreaseQuantityButton = page.locator('[data-testid="decrease-quantity"]');
    this.increaseQuantityButton = page.locator('[data-testid="increase-quantity"]');
    this.quantityValue = page.locator('[data-testid="quantity-value"]');
    this.notFoundMessage = page.locator('[data-testid="product-not-found"]');
    this.loadingMessage = page.locator('[data-testid="product-loading"]');
  }

  async goto(productId: number) {
    await this.page.goto(`/products/${productId}`);
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async removeFromCart() {
    await this.removeFromCartButton.click();
  }

  async increaseQuantity(times: number = 1) {
    for (let i = 0; i < times; i++) {
      await this.increaseQuantityButton.click();
    }
  }

  async decreaseQuantity(times: number = 1) {
    for (let i = 0; i < times; i++) {
      await this.decreaseQuantityButton.click();
    }
  }

  async getQuantityValue(): Promise<number> {
    const quantityText = await this.quantityValue.textContent();
    return quantityText ? parseInt(quantityText, 10) : 0;
  }
} 