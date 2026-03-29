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
    this.heading = page.getByTestId('home-welcome-title');
    this.welcomeMessage = page.getByTestId('home-welcome-title');
    this.applicationFeaturesSection = page.getByTestId('home-features-title');
    this.advancedMonitoringSection = page.getByTestId('home-monitoring-title');
    this.aiIntegrationSection = page.getByTestId('home-ai-title');
    this.viewProductsButton = page.getByTestId('home-products-button');
    this.manageUsersButton = page.getByTestId('home-users-button');
    this.viewProfileOrdersButton = page.getByTestId('home-profile-button');
    this.openTrafficMonitorButton = page.getByTestId('home-traffic-button');
    this.openAIAssistantButton = page.getByTestId('home-llm-button');
    this.generateQRCodesButton = page.getByTestId('home-qr-button');
    this.sendEmailsButton = page.getByTestId('home-email-button');
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
