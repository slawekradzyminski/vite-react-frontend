import { type Page, type Locator } from '@playwright/test';

export class HomePage {
  readonly heading: Locator;
  readonly welcomeMessage: Locator;
  readonly applicationFeaturesSection: Locator;
  readonly advancedMonitoringSection: Locator;
  readonly aiIntegrationSection: Locator;
  readonly viewProductsButton: Locator;
  readonly manageUsersButton: Locator;
  readonly viewProfileOrdersButton: Locator;
  readonly openTrafficMonitorButton: Locator;
  readonly openAIAssistantButton: Locator;
  readonly generateQRCodesButton: Locator;
  readonly sendEmailsButton: Locator;
  readonly websocketText: Locator;
  readonly sseText: Locator;
  readonly privateDataText: Locator;
  readonly qrCodeInfoText: Locator;
  readonly emailDelayText: Locator;

  constructor(protected readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /welcome/i });
    this.welcomeMessage = page.getByText(/welcome/i);
    this.applicationFeaturesSection = page.getByText('Application Features').first();
    this.advancedMonitoringSection = page.getByText('Advanced Monitoring').first();
    this.aiIntegrationSection = page.getByText('AI Integration').first();
    this.viewProductsButton = page.getByRole('button', { name: 'View Products' });
    this.manageUsersButton = page.getByRole('button', { name: 'Manage Users' });
    this.viewProfileOrdersButton = page.getByRole('button', { name: 'View Profile & Orders' });
    this.openTrafficMonitorButton = page.getByRole('button', { name: 'Open Traffic Monitor' });
    this.openAIAssistantButton = page.getByRole('button', { name: 'Open AI Assistant' });
    this.generateQRCodesButton = page.getByRole('button', { name: 'Generate QR Codes' });
    this.sendEmailsButton = page.getByRole('button', { name: 'Send Emails' });
    this.websocketText = page.getByText(/WebSocket technology/i);
    this.sseText = page.getByText(/Server-Sent Events \(SSE\)/i);
    this.privateDataText = page.getByText(/View orders and manage your personal account information/i);
    this.qrCodeInfoText = page.getByText(/Generate valid and scannable QR codes/i);
    this.emailDelayText = page.getByText(/delay of up to 10 minutes/i);
  }

  async goto() {
    await this.page.goto('/');
  }

  async navigateToProducts() {
    await this.viewProductsButton.click();
  }

  async navigateToUsers() {
    await this.manageUsersButton.click();
  }

  async navigateToProfileOrders() {
    await this.viewProfileOrdersButton.click();
  }

  async navigateToTrafficMonitor() {
    await this.openTrafficMonitorButton.click();
  }

  async navigateToAIAssistant() {
    await this.openAIAssistantButton.click();
  }

  async navigateToQRGenerator() {
    await this.generateQRCodesButton.click();
  }

  async navigateToEmailService() {
    await this.sendEmailsButton.click();
  }
} 