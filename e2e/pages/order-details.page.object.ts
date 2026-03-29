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
    this.orderTitle = this.page.getByTestId('order-details-title');
    this.orderStatus = this.page.getByTestId('order-details-status');
    this.orderItems = this.page.locator('[data-testid="order-details-items-list"] > [data-testid^="order-item-"]');
    this.totalAmount = this.page.getByTestId('order-details-total-amount');
    this.shippingAddress = this.page.getByTestId('order-details-shipping-address');
    this.cancelButton = this.page.getByTestId('order-details-cancel-button');
    this.statusSelect = this.page.getByTestId('order-details-status-select');
    this.updateButton = this.page.getByTestId('order-details-update-status-button');
  }

  async navigateToOrder(orderId: number) {
    await this.page.goto(`/orders/${orderId}`);
  }

  async cancelOrder() {
    this.page.on('dialog', dialog => dialog.accept());
    await this.cancelButton.click();
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
