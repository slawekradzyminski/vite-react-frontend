import { type Page, type Locator } from '@playwright/test';

export class ProfilePage {
  readonly heading: Locator;
  readonly personalInfoHeading: Locator;
  readonly systemPromptHeading: Locator;
  readonly ordersHeading: Locator;
  readonly systemPromptTextarea: Locator;
  readonly savePromptButton: Locator;
  readonly emailInput: Locator;
  readonly firstNameInput: Locator;
  readonly saveChangesButton: Locator;
  readonly ordersTable: Locator;
  readonly noOrdersMessage: Locator;
  readonly orderIdColumnHeader: Locator;
  readonly dateColumnHeader: Locator;
  readonly statusColumnHeader: Locator;
  readonly totalColumnHeader: Locator;

  constructor(protected readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Profile' });
    this.personalInfoHeading = page.getByRole('heading', { name: 'Personal Information' });
    this.systemPromptHeading = page.getByRole('heading', { name: 'System Prompt' });
    this.ordersHeading = page.getByRole('heading', { name: 'Your Orders' });
    this.systemPromptTextarea = page.getByLabel('Your System Prompt');
    this.savePromptButton = page.getByRole('button', { name: 'Save Prompt' });
    this.emailInput = page.getByLabel('Email');
    this.firstNameInput = page.getByLabel('First Name');
    this.saveChangesButton = page.getByRole('button', { name: 'Save Changes' });
    this.ordersTable = page.locator('table');
    this.noOrdersMessage = page.getByText("You don't have any orders yet.");
    this.orderIdColumnHeader = page.getByRole('columnheader', { name: 'Order ID' });
    this.dateColumnHeader = page.getByRole('columnheader', { name: 'Date' });
    this.statusColumnHeader = page.getByRole('columnheader', { name: 'Status' });
    this.totalColumnHeader = page.getByRole('columnheader', { name: 'Total' });
  }

  async goto() {
    await this.page.goto('/profile');
    await this.page.waitForSelector('h1:has-text("Profile")');
  }

  async updateSystemPrompt(newPrompt: string) {
    await this.systemPromptTextarea.fill(newPrompt);
    await this.savePromptButton.click();
  }

  async updateFirstName(newName: string) {
    await this.firstNameInput.fill(newName);
    await this.saveChangesButton.click();
  }

  async hasOrders(): Promise<boolean> {
    return await this.ordersTable.count() > 0;
  }
} 