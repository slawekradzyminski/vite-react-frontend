import { test, expect } from '@playwright/test';
import { getRandomUser } from './generators/userGenerator';
import { registerUser } from './http/postSignUp';
import { LoginPage } from './pages/login.page';

test.describe('QR Code Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should render QR code generator with all elements', async ({ page }) => {
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
    await expect(page.getByRole('textbox')).toBeVisible();
    await expect(page.getByRole('button', { name: /generate qr code/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /clear/i })).toBeVisible();
  });

  test('should generate and display QR code', async ({ page }) => {
    // given
    const user = getRandomUser();
    await registerUser(user);
    await loginPage.goto();
    await loginPage.attemptLogin({
      username: user.username,
      password: user.password,
    });
    await page.getByText('QR Code').click();

    // when
    await page.getByRole('textbox').fill('test text');
    await page.getByRole('button', { name: /generate qr code/i }).click();

    // then
    await expect(page.getByRole('img', { name: /generated qr code/i })).toBeVisible();
  });

  test('should show error when submitting empty text', async ({ page }) => {
    // given
    const user = getRandomUser();
    await registerUser(user);
    await loginPage.goto();
    await loginPage.attemptLogin({
      username: user.username,
      password: user.password,
    });
    await page.getByText('QR Code').click();

    // when
    await page.getByRole('button', { name: /generate qr code/i }).click();

    // then
    await expect(page.locator('[data-state="open"]')).toContainText('Please enter text to generate QR code');
  });

  test('should clear QR code when clicking clear button', async ({ page }) => {
    // given
    const user = getRandomUser();
    await registerUser(user);
    await loginPage.goto();
    await loginPage.attemptLogin({
      username: user.username,
      password: user.password,
    });
    await page.getByText('QR Code').click();

    // when - generate QR code
    await page.getByRole('textbox').fill('test text');
    await page.getByRole('button', { name: /generate qr code/i }).click();
    await expect(page.getByRole('img', { name: /generated qr code/i })).toBeVisible();

    // when - clear QR code
    await page.getByRole('button', { name: /clear/i }).click();

    // then
    await expect(page.getByRole('img', { name: /generated qr code/i })).not.toBeVisible();
    await expect(page.getByRole('textbox')).toHaveValue('');
  });
}); 