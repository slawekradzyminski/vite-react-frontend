import { test, expect } from './fixtures/auth.fixture';
import { DesktopNavigation, MobileNavigation } from './pages/navigation';

test.describe('Navigation', () => {
  let desktopNav: DesktopNavigation;
  let mobileNav: MobileNavigation;

  test.beforeEach(async ({ authenticatedPage }) => {
    const page = authenticatedPage.page;
    desktopNav = new DesktopNavigation(page);
    mobileNav = new MobileNavigation(page);
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('should handle logout correctly in desktop view', async ({ authenticatedPage }) => {
    // then
    await expect(desktopNav.userFullName).toHaveText(`${authenticatedPage.user.firstName} ${authenticatedPage.user.lastName}`);
    await expect(desktopNav.productsLink).toBeVisible();
    await expect(desktopNav.cartLink).toBeVisible();

    // when
    await desktopNav.logout();

    // then
    await expect(authenticatedPage.page).toHaveURL('/login');
  });

  test('should handle logout correctly in mobile view', async ({ authenticatedPage }) => {
    // given
    await mobileNav.setMobileViewport();
    
    // when
    await mobileNav.openMenu();

    // then
    await expect(mobileNav.homeLink).toBeVisible();
    await expect(mobileNav.productsLink).toBeVisible();
    await expect(mobileNav.cartLink).toBeVisible();

    // when
    await mobileNav.logout();

    // then
    await expect(authenticatedPage.page).toHaveURL('/login');
  });

  test('should navigate to QR code page', async ({ authenticatedPage }) => {
    // when
    await desktopNav.qrCodeLink.click();

    // then
    await expect(authenticatedPage.page).toHaveURL('/qr');
    await expect(authenticatedPage.page.getByRole('heading', { name: /qr code generator/i })).toBeVisible();
  });

  test('should navigate to QR code page in mobile view', async ({ authenticatedPage }) => {
    // given
    await mobileNav.setMobileViewport();

    // when
    await mobileNav.openMenu();
    await mobileNav.qrCodeLink.click();

    // then
    await expect(authenticatedPage.page).toHaveURL('/qr');
    await expect(authenticatedPage.page.getByRole('heading', { name: /qr code generator/i })).toBeVisible();
  });
}); 