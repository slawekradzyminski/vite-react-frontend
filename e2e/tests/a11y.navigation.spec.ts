import { test, expect } from '../fixtures/auth.fixture';
import { Locator, Page } from '@playwright/test';

async function expectNextFocus(page: Page, locator: Locator) {
  await page.keyboard.press('Tab');
  await expect(locator).toBeFocused();
}

test.describe('Navigation keyboard accessibility', () => {
  test('supports sequential keyboard traversal on desktop', async ({ authenticatedPage }) => {
    // given
    const { page } = authenticatedPage;
    await page.goto('/');
    await expect(page.getByTestId('desktop-menu-products')).toBeVisible();

    const adminLink = page.getByTestId('desktop-menu-admin');
    const expectedTabOrder = [
      'brand-link',
      'desktop-menu-products',
      'desktop-menu-send-email',
      'desktop-menu-qr-code',
      'desktop-menu-llm',
      'desktop-menu-traffic-monitor',
    ];
    if (await adminLink.count()) {
      expectedTabOrder.push('desktop-menu-admin');
    }
    expectedTabOrder.push('commerce-transport', 'desktop-cart-icon', 'username-profile-link', 'logout-button');

    const actualTabOrder = await page
      .locator('nav a, nav button, nav select')
      .evaluateAll(elements =>
        elements
          .filter(element => {
            const htmlElement = element as HTMLElement;
            return !htmlElement.hidden && htmlElement.tabIndex >= 0 && htmlElement.offsetParent !== null;
          })
          .map(element => (element as HTMLElement).dataset.testid)
          .filter(Boolean)
      );

    expect(actualTabOrder).toEqual(expectedTabOrder);

    // when / then
    await page.getByTestId(expectedTabOrder[0]).focus();
    await expect(page.getByTestId(expectedTabOrder[0])).toBeFocused();
    for (const testId of expectedTabOrder.slice(1)) {
      await expectNextFocus(page, page.getByTestId(testId));
    }
  });

  test('supports keyboard access in mobile menu and closes after navigation', async ({ authenticatedPage }) => {
    // given
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

    // when
    await brandLink.focus();
    await expect(brandLink).toBeFocused();
    await expectNextFocus(page, page.getByRole('combobox', { name: 'Shop API' }));
    await expectNextFocus(page, cartButton);
    await expectNextFocus(page, menuToggle);

    await page.keyboard.press('Enter');
    await expect(mobileMenu).toBeVisible();

    await expectNextFocus(page, productsLink);
    await expectNextFocus(page, emailLink);
    await page.keyboard.press('Enter');

    // then
    await expect(page).toHaveURL(/\/email/);
    await expect(mobileMenu).toBeHidden();
  });
});
