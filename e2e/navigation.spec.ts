import { test, expect } from './fixtures/auth.fixture';

test.describe('Navigation', () => {
  test('should handle logout correctly in desktop view', async ({ authenticatedPage }) => {
    // given
    const page = authenticatedPage.page;
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByText(`${authenticatedPage.user.firstName} ${authenticatedPage.user.lastName}`)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Products')).toBeVisible();
    await expect(page.getByText('Cart')).toBeVisible();

    // when
    await page.locator('nav').getByRole('button', { name: 'Logout' }).click();

    // then
    await expect(page).toHaveURL('/login');
  });

  test('should handle logout correctly in mobile view', async ({ authenticatedPage }) => {
    // given
    const page = authenticatedPage.page;
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // when
    await page.locator('nav').getByRole('button', { name: 'Open main menu' }).click();
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
    await expect(page.getByTestId('mobile-menu-home')).toBeVisible();
    await expect(page.getByTestId('mobile-menu-products')).toBeVisible();
    await expect(page.getByTestId('mobile-menu-cart')).toBeVisible();
    await page.locator('nav').getByRole('button', { name: 'Logout' }).click();

    // then
    await expect(page).toHaveURL('/login');
  });

  test('should navigate to QR code page', async ({ authenticatedPage }) => {
    // given
    const page = authenticatedPage.page;
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // when
    await page.getByText('QR Code').click();

    // then
    await expect(page).toHaveURL('/qr');
    await expect(page.getByRole('heading', { name: /qr code generator/i })).toBeVisible();
  });

  test('should navigate to QR code page in mobile view', async ({ authenticatedPage }) => {
    // given
    const page = authenticatedPage.page;
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // when
    await page.locator('nav').getByRole('button', { name: 'Open main menu' }).click();
    await page.getByTestId('mobile-menu-qr code').click();

    // then
    await expect(page).toHaveURL('/qr');
    await expect(page.getByRole('heading', { name: /qr code generator/i })).toBeVisible();
  });
}); 