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
    await this.page.waitForSelector('table', { state: 'visible' });
    return this.page.locator('table tbody tr td:first-child a').allTextContents();
  }

  async getCartItemPrices() {
    return this.page.locator('table tbody tr td:nth-child(4)').allTextContents();
  }

  async getCartTotalPrice() {
    const priceText = await this.page.locator('text=Total >> xpath=following-sibling::span').first().textContent();
    return priceText || '';
  }

  async getCartTotalItems() {
    const itemsText = await this.page.locator('text=Items >> xpath=following-sibling::span').first().textContent();
    return itemsText || '';
  }

  async updateItemQuantity(productName: string, newQuantity: number) {
    const row = this.page.locator('table tbody tr', {
      has: this.page.locator('a', { hasText: productName })
    });

    const quantityCell = row.locator('td:nth-child(3)');
    
    const quantityText = await quantityCell.locator('.px-4.py-1.border-t.border-b').textContent();
    const currentQuantity = quantityText ? parseInt(quantityText, 10) : 0;

    if (newQuantity > currentQuantity) {
      for (let i = 0; i < newQuantity - currentQuantity; i++) {
        await quantityCell.locator('button', { hasText: '+' }).click();
      }
    } else if (newQuantity < currentQuantity) {
      for (let i = 0; i < currentQuantity - newQuantity; i++) {
        await quantityCell.locator('button', { hasText: '-' }).click();
      }
    }

    const updateButton = quantityCell.locator('button', { hasText: 'Update' });
    if (await updateButton.isVisible()) {
      await updateButton.click();
    }
  }

  async removeItem(productName: string) {
    const row = this.page.locator('table tbody tr', {
      has: this.page.locator('a', { hasText: productName })
    });

    await row.locator('td:last-child button', { hasText: 'Remove' }).click();
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