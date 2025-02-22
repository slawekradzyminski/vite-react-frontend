import { test, expect } from './fixtures/auth.fixture';
test.describe('QR Code Page', () => {

  test.beforeEach(async ({ authenticatedPage }) => {
    const page = authenticatedPage.page;
    await page.goto('/qr');
  });

  test('should render QR code generator with all elements', async ({ authenticatedPage }) => {
    // given
    const page = authenticatedPage.page;

    // then
    await expect(page).toHaveURL('/qr');
    await expect(page.getByRole('heading', { name: /qr code generator/i })).toBeVisible();
    await expect(page.getByRole('textbox')).toBeVisible();
    await expect(page.getByRole('button', { name: /generate qr code/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /clear/i })).toBeVisible();
  });

  test('should generate and display QR code', async ({ authenticatedPage }) => {
    // given
    const page = authenticatedPage.page;

    // when
    await page.getByRole('textbox').fill('test text');
    await page.getByRole('button', { name: /generate qr code/i }).click();

    // then
    await expect(page.getByRole('img', { name: /generated qr code/i })).toBeVisible();
  });

  test('should show error when submitting empty text', async ({ authenticatedPage }) => {
    // given
    const page = authenticatedPage.page;

    // when
    await page.getByRole('button', { name: /generate qr code/i }).click();

    // then
    await expect(page.locator('[data-state="open"]')).toContainText('Please enter text to generate QR code');
  });

  test('should clear QR code when clicking clear button', async ({ authenticatedPage }) => {
    // given
    const page = authenticatedPage.page;

    // when
    await page.getByRole('textbox').fill('test text');
    await page.getByRole('button', { name: /generate qr code/i }).click();
    await expect(page.getByRole('img', { name: /generated qr code/i })).toBeVisible();
    await page.getByRole('button', { name: /clear/i }).click();

    // then
    await expect(page.getByRole('img', { name: /generated qr code/i })).not.toBeVisible();
    await expect(page.getByRole('textbox')).toHaveValue('');
  });
}); 