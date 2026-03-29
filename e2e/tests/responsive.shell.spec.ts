import { test, expect } from '../fixtures/auth.fixture';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > window.innerWidth + 1;
  });

  expect(hasOverflow).toBe(false);
}

test.describe('Responsive shell smoke checks', () => {
  test('keeps home shell stable on mobile', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    await expect(page.getByTestId('mobile-menu-toggle')).toBeVisible();
    await expect(page.getByTestId('desktop-menu')).toBeHidden();
    await expect(page.getByTestId('home-welcome-section')).toBeVisible();
    await expect(page.getByTestId('home-products-button')).toBeVisible();
    await page.getByTestId('app-footer').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('app-footer')).toBeVisible();
    await expect(page.getByTestId('footer-blog-link')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps login form usable on short mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 720 });
    await page.goto('/login');

    await expect(page.getByTestId('login-form')).toBeVisible();
    await page.getByTestId('login-submit-button').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('login-submit-button')).toBeVisible();
    await expect(page.getByTestId('app-footer')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps cart page within the viewport on mobile', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/cart');

    await expect(page.getByTestId('cart-page')).toBeVisible();
    await expect(page.getByTestId('cart-title')).toBeVisible();
    await expect(page.getByTestId('app-footer')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps traffic monitor page within the viewport on mobile', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/traffic');

    await expect(page.getByTestId('traffic-monitor-page')).toBeVisible();
    await expect(page.getByTestId('traffic-title')).toBeVisible();
    await expect(page.getByTestId('app-footer')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
