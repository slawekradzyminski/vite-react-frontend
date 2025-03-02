import { test, expect } from '../fixtures/auth.fixture';
import { DesktopNavigation, MobileNavigation } from '../pages/navigation';

test.describe('Navigation', () => {
  let desktopNav: DesktopNavigation;
  let mobileNav: MobileNavigation;

  test.beforeEach(async ({ authenticatedPage }) => {
    desktopNav = new DesktopNavigation(authenticatedPage.page);
    mobileNav = new MobileNavigation(authenticatedPage.page);
    await authenticatedPage.page.goto('http://localhost:8081/');
  });

  test('should handle logout in desktop view', async ({ authenticatedPage }) => {
    // given
    await expect(desktopNav.userFullName).toBeVisible();
    
    // when
    await desktopNav.logout();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/login/);
  });

  test('should handle logout in mobile view', async ({ authenticatedPage }) => {
    // given
    await mobileNav.setMobileViewport();
    await mobileNav.openMenu();
    await expect(mobileNav.logoutButton).toBeVisible();
    
    // when
    await mobileNav.logout();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/login/);
  });

  test('should navigate to QR code page in desktop view', async ({ authenticatedPage }) => {
    // given
    await expect(desktopNav.qrCodeLink).toBeVisible();
    
    // when
    await desktopNav.qrCodeLink.click();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/qr/);
    await expect(authenticatedPage.page.locator('h1')).toContainText('QR Code Generator');
  });

  test('should navigate to QR code page in mobile view', async ({ authenticatedPage }) => {
    // given
    await mobileNav.setMobileViewport();
    await mobileNav.openMenu();
    await expect(mobileNav.qrCodeLink).toBeVisible();
    
    // when
    await mobileNav.qrCodeLink.click();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/qr/);
    await expect(authenticatedPage.page.locator('h1')).toContainText('QR Code Generator');
  });

  test('should navigate to Cart page in desktop view', async ({ authenticatedPage }) => {
    // given
    await expect(desktopNav.cartLink).toBeVisible();
    
    // when
    await desktopNav.cartLink.click();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/cart/);
    await expect(authenticatedPage.page.locator('h1')).toContainText('Your Cart');
  });

  test('should navigate to Cart page in mobile view', async ({ authenticatedPage }) => {
    // given
    await mobileNav.setMobileViewport();
    await mobileNav.openMenu();
    await expect(mobileNav.cartLink).toBeVisible();
    
    // when
    await mobileNav.cartLink.click();
    
    // then
    await expect(authenticatedPage.page).toHaveURL(/\/cart/);
    await expect(authenticatedPage.page.locator('h1')).toContainText('Your Cart');
  });

}); 