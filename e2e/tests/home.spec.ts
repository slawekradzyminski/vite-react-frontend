import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/home.page.object';

test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    homePage = new HomePage(authenticatedPage.page);
    await homePage.goto();
  });

  // given
  test('should display welcome message with user name', async ({ authenticatedPage }) => {
    const { user } = authenticatedPage;
    
    // then
    await expect(homePage.heading).toBeVisible();
    await expect(homePage.welcomeMessage).toContainText(user.firstName);
  });

  // given
  test('should display all feature sections', async () => {
    // then
    await expect(homePage.applicationFeaturesSection).toBeVisible();
    await expect(homePage.advancedMonitoringSection).toBeVisible();
    await expect(homePage.aiIntegrationSection).toBeVisible();
  });

  // given
  test('should display information about WebSockets and SSE', async () => {
    // then
    await expect(homePage.websocketText).toBeVisible();
    await expect(homePage.sseText).toBeVisible();
  });

  // given
  test('should display information about utilities', async () => {
    // then
    await expect(homePage.privateDataText).toBeVisible();
    await expect(homePage.qrCodeInfoText).toBeVisible();
    await expect(homePage.emailDelayText).toBeVisible();
  });

  // given
  test('should navigate to products page when clicking View Products', async ({ authenticatedPage }) => {
    // when
    await homePage.navigateToProducts();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/products/);
  });

  // given
  test('should navigate to profile page when clicking View Profile & Orders', async ({ authenticatedPage }) => {
    // when
    await homePage.navigateToProfileOrders();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/profile/);
  });

  // given
  test('should navigate to traffic monitor when clicking Open Traffic Monitor', async ({ authenticatedPage }) => {
    // when
    await homePage.navigateToTrafficMonitor();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/traffic/);
  });

  // given
  test('should navigate to AI Assistant page when clicking Open AI Assistant', async ({ authenticatedPage }) => {
    // when
    await homePage.navigateToAIAssistant();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/llm/);
  });

  // given
  test('should navigate to QR page when clicking Generate QR Codes', async ({ authenticatedPage }) => {
    // when
    await homePage.navigateToQRGenerator();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/qr/);
  });

  // given
  test('should navigate to Email page when clicking Send Emails', async ({ authenticatedPage }) => {
    // when
    await homePage.navigateToEmailService();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/email/);
  });
}); 