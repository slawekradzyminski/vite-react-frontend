import { test, expect } from './fixtures/auth.fixture';
import { QrPage } from './pages/qr.page';

test.describe('QR Code Page', () => {
  let qrPage: QrPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    qrPage = new QrPage(authenticatedPage.page);
    await qrPage.goto();
  });

  test('should render QR code generator with all elements', async () => {
    // then
    await expect(qrPage.heading).toBeVisible();
    await expect(qrPage.textInput).toBeVisible();
    await expect(qrPage.generateButton).toBeVisible();
    await expect(qrPage.clearButton).toBeVisible();
  });

  test('should generate and display QR code', async () => {
    // when
    await qrPage.generateQrCode('test text');

    // then
    await expect(qrPage.qrCodeImage).toBeVisible();
  });

  test('should show error when submitting empty text', async () => {
    // when
    await qrPage.generateButton.click();

    // then
    await expect(qrPage.toast).toContainText('Please enter text to generate QR code');
  });

  test('should clear QR code when clicking clear button', async () => {
    // when
    await qrPage.generateQrCode('test text');
    await expect(qrPage.qrCodeImage).toBeVisible();
    await qrPage.clear();

    // then
    await expect(qrPage.qrCodeImage).not.toBeVisible();
    await expect(qrPage.textInput).toHaveValue('');
  });
}); 