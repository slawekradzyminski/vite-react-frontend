import { test, expect } from '../fixtures/auth.fixture';
import { Locator, Page } from '@playwright/test';

async function expectNextFocus(page: Page, locator: Locator) {
  await page.keyboard.press('Tab');
  await expect(locator).toBeFocused();
}

test.describe('Navigation keyboard accessibility', () => {
  test('supports sequential keyboard traversal on desktop', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    await page.goto('/');

    const brandLink = page.getByTestId('brand-link');
    const productsLink = page.getByTestId('desktop-menu-products');
    const emailLink = page.getByTestId('desktop-menu-send-email');
    const qrLink = page.getByTestId('desktop-menu-qr-code');
    const llmLink = page.getByTestId('desktop-menu-llm');
    const trafficLink = page.getByTestId('desktop-menu-traffic-monitor');
    const adminLink = page.getByTestId('desktop-menu-admin');
    const cartButton = page.getByTestId('desktop-cart-icon');
    const profileLink = page.getByTestId('username-profile-link');
    const logoutButton = page.getByTestId('logout-button');
    await brandLink.focus();
    await expect(brandLink).toBeFocused();
    await expectNextFocus(page, productsLink);
    await expectNextFocus(page, emailLink);
    await expectNextFocus(page, qrLink);
    await expectNextFocus(page, llmLink);
    await expectNextFocus(page, trafficLink);
    if (await adminLink.count()) {
      await expectNextFocus(page, adminLink);
    }
    await expectNextFocus(page, cartButton);
    await expectNextFocus(page, profileLink);
    await expectNextFocus(page, logoutButton);
  });

  test('supports keyboard access in mobile menu and closes after navigation', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const brandLink = page.getByTestId('brand-link');
    const cartButton = page.getByTestId('desktop-cart-icon');
    const menuToggle = page.getByTestId('mobile-menu-toggle');
    const mobileMenu = page.getByTestId('mobile-menu');
    const productsLink = page.getByTestId('mobile-menu-products');
    const emailLink = page.getByTestId('mobile-menu-send-email');

    await expect(page.getByTestId('desktop-menu')).toBeHidden();
    await expect(menuToggle).toBeVisible();

    await brandLink.focus();
    await expect(brandLink).toBeFocused();
    await expectNextFocus(page, cartButton);
    await expectNextFocus(page, menuToggle);

    await page.keyboard.press('Enter');
    await expect(mobileMenu).toBeVisible();

    await expectNextFocus(page, productsLink);
    await expectNextFocus(page, emailLink);
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/email/);
    await expect(mobileMenu).toBeHidden();
  });
});
