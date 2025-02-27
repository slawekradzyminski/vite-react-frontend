import { Page, Locator } from '@playwright/test';

export class OrderDetailsPage {
  readonly page: Page;
  readonly orderTitle: Locator;
  readonly orderStatus: Locator;
  readonly orderItems: Locator;
  readonly totalAmount: Locator;
  readonly shippingAddress: Locator;
  readonly cancelButton: Locator;
  readonly statusSelect: Locator;
  readonly updateButton: Locator;

  constructor(authenticatedPage: any) {
    this.page = authenticatedPage.page;
    this.orderTitle = this.page.locator('h1:has-text("Order #")');
    this.orderStatus = this.page.locator('.rounded-full');
    this.orderItems = this.page.locator('.space-y-4 > div');
    this.totalAmount = this.page.locator('.border-t .font-bold.text-lg');
    this.shippingAddress = this.page.locator('h2:has-text("Shipping Address") + div');
    this.cancelButton = this.page.locator('button:has-text("Cancel Order")');
    this.statusSelect = this.page.locator('select');
    this.updateButton = this.page.locator('button:has-text("Update")');
  }

  async navigateToOrder(orderId: number) {
    await this.page.goto(`/orders/${orderId}`);
  }

  async cancelOrder() {
    // Store dialog handler before clicking
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.cancelButton.click();
    const dialog = await dialogPromise;
    await dialog.accept();
  }

  async updateOrderStatus(status: string) {
    await this.statusSelect.selectOption(status);
    await this.updateButton.click();
  }

  async getOrderId(): Promise<string> {
    const titleText = await this.orderTitle.textContent() || '';
    const match = titleText.match(/Order #(\d+)/);
    return match ? match[1] : '';
  }

  async getOrderStatus(): Promise<string> {
    return (await this.orderStatus.textContent() || '').trim();
  }

  async getItemsCount(): Promise<number> {
    return await this.orderItems.count();
  }

  async getTotalAmount(): Promise<string> {
    return (await this.totalAmount.textContent() || '').trim();
  }
} 