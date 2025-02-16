import { test, expect } from '@playwright/test';
import { getRandomUser } from './generators/userGenerator';
import { registerUser } from './http/postSignUp';
import { LoginPage } from './pages/login.page';

test.describe('Navigation', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should handle logout correctly in desktop view', async ({ page }) => {
    // given
    const user = getRandomUser();
    await registerUser(user);
    await loginPage.goto();

    // when
    await loginPage.attemptLogin({
      username: user.username,
      password: user.password,
    });

    // then - wait for navigation and verify logged in state
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText(`${user.firstName} ${user.lastName}`)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Products')).toBeVisible();
    await expect(page.getByText('Cart')).toBeVisible();

    // when - click logout in navigation
    await page.locator('nav').getByRole('button', { name: 'Logout' }).click();

    // then - verify logged out state
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Login')).toBeVisible();
  });

  test('should handle logout correctly in mobile view', async ({ page }) => {
    // given
    const user = getRandomUser();
    await registerUser(user);
    await page.setViewportSize({ width: 375, height: 667 });
    await loginPage.goto();

    // when
    await loginPage.attemptLogin({
      username: user.username,
      password: user.password,
    });

    // then - wait for navigation and verify logged in state
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // open mobile menu and verify items
    await page.locator('nav').getByRole('button', { name: 'Open main menu' }).click();
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
    await expect(page.getByTestId('mobile-menu-home')).toBeVisible();
    await expect(page.getByTestId('mobile-menu-products')).toBeVisible();
    await expect(page.getByTestId('mobile-menu-cart')).toBeVisible();

    // when - click logout
    await page.locator('nav').getByRole('button', { name: 'Logout' }).click();

    // then - verify logged out state
    await expect(page).toHaveURL('/login');
    // verify mobile menu button is not visible
    await expect(page.locator('nav').getByRole('button', { name: 'Open main menu' })).not.toBeVisible();
    // verify login link is visible
    await expect(page.getByText('Login')).toBeVisible();
  });

  test('should navigate to QR code page', async ({ page }) => {
    // given
    const user = getRandomUser();
    await registerUser(user);
    await loginPage.goto();
    await loginPage.attemptLogin({
      username: user.username,
      password: user.password,
    });

    // when
    await page.getByText('QR Code').click();

    // then
    await expect(page).toHaveURL('/qr');
    await expect(page.getByRole('heading', { name: /qr code generator/i })).toBeVisible();
  });

  test('should navigate to QR code page in mobile view', async ({ page }) => {
    // given
    const user = getRandomUser();
    await registerUser(user);
    await page.setViewportSize({ width: 375, height: 667 });
    await loginPage.goto();
    await loginPage.attemptLogin({
      username: user.username,
      password: user.password,
    });

    // wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // when - open mobile menu and click QR Code
    await page.locator('nav').getByRole('button', { name: 'Open main menu' }).click();
    await page.getByTestId('mobile-menu-qr code').click();

    // then
    await expect(page).toHaveURL('/qr');
    await expect(page.getByRole('heading', { name: /qr code generator/i })).toBeVisible();
  });
}); 