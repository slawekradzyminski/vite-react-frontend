import { Page } from '@playwright/test';

export class CartPage {
  constructor(private readonly page: Page) {}

  get cartTitle() { return this.page.getByRole('heading', { name: 'Your Cart' }); }
  get cartItemsHeading() { return this.page.getByRole('heading', { name: 'Cart Items' }); }
  get cartSummaryHeading() { return this.page.getByRole('heading', { name: 'Cart Summary' }); }
  get emptyCartMessage() { return this.page.getByText('Your cart is empty'); }
  get browseProductsButton() { return this.page.getByRole('link', { name: 'Browse Products' }); }
  get continueShoppingLink() { return this.page.getByRole('link', { name: 'Continue Shopping' }); }
  get proceedToCheckoutButton() { return this.page.getByRole('button', { name: 'Proceed to Checkout' }); }
  get clearCartButton() { return this.page.getByRole('button', { name: /Clear Cart|Clearing.../ }); }
  get loadingMessage() { return this.page.getByText('Loading cart...'); }
  get errorMessage() { return this.page.getByText('Error loading cart'); }
  get tryAgainButton() { return this.page.getByRole('button', { name: 'Try again' }); }

  async navigate() {
    await this.page.goto('/cart');
  }

  async getCartItemNames() {
    await this.page.waitForSelector('.space-y-6 a', { state: 'attached' });
    return this.page.locator('.space-y-6 a').allTextContents();
  }

  async getCartItemPrices() {
    return this.page.locator('.text-right.min-w-\\[80px\\]').allTextContents();
  }

  async getCartTotalPrice() {
    const priceText = await this.page.locator('.font-semibold.text-lg span:last-child').textContent();
    return priceText || '';
  }

  async getCartTotalItems() {
    const itemsText = await this.page.locator('.space-y-3.mb-6 div:first-child span:last-child').textContent();
    return itemsText || '';
  }

  async updateItemQuantity(productName: string, newQuantity: number) {
    const itemRow = this.page.locator('.space-y-6 > div', {
      has: this.page.locator('a', { hasText: productName })
    });

    const quantityText = await itemRow.locator('.px-4.py-1.border-t.border-b').textContent();
    const currentQuantity = quantityText ? parseInt(quantityText, 10) : 0;

    if (newQuantity > currentQuantity) {
      for (let i = 0; i < newQuantity - currentQuantity; i++) {
        await itemRow.locator('button', { hasText: '+' }).click();
      }
    } else if (newQuantity < currentQuantity) {
      for (let i = 0; i < currentQuantity - newQuantity; i++) {
        await itemRow.locator('button', { hasText: '-' }).click();
      }
    }

    const updateButton = itemRow.locator('button', { hasText: 'Update' });
    if (await updateButton.isVisible()) {
      await updateButton.click();
    }
  }

  async removeItem(productName: string) {
    const itemRow = this.page.locator('.space-y-6 > div', {
      has: this.page.locator('a', { hasText: productName })
    });

    await itemRow.locator('button', { hasText: 'Remove' }).click();
  }

  async clearCart() {
    this.page.on('dialog', dialog => dialog.accept());
    await this.clearCartButton.click();
  }

  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
  }

  async continueShopping() {
    await this.continueShoppingLink.click();
  }
} 