import { test, expect } from '../fixtures/mocked-session.fixture';
import { fulfillWithSchema } from '../mocks/backendContract';
import { ISSUED_GIFT_CARD_CODE, mockAdminGiftCards, mockVatRates } from '../mocks/adminCommerceMocks';
import { AdminGiftCardsPage, AdminVatRatesPage } from '../pages/admin-commerce.page.object';

test.describe('Admin commerce settings (mocked backend)', () => {
  test('admin issues a gift card from the dashboard and sees its code', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    await page.route('**/api/v1/products', (route) => fulfillWithSchema(route, 'ProductDto', []));
    await page.route(/\/api\/v1\/orders\/admin(\?.*)?$/, (route) =>
      fulfillWithSchema(route, 'PageDtoOrderDto', { content: [], pageNumber: 0, pageSize: 50, totalElements: 0, totalPages: 0 }));
    const backend = await mockAdminGiftCards(page);
    const giftCards = new AdminGiftCardsPage(page);
    await giftCards.gotoFromDashboard();
    await expect(page).toHaveURL(/\/admin\/gift-cards$/);
    await expect(page.getByTestId('admin-gift-cards-empty')).toBeVisible();

    // when
    await giftCards.issueCard('75', 'client');

    // then
    await expect(giftCards.issuedCode).toHaveText(ISSUED_GIFT_CARD_CODE);
    await expect(giftCards.row(ISSUED_GIFT_CARD_CODE)).toContainText('$75.00');
    expect(backend.cards[0]).toMatchObject({ initialAmount: 75, recipientUsername: 'client' });
  });

  test('admin edits a VAT rate inline, with validation', async ({ mockedAdmin }) => {
    // given
    const { page } = mockedAdmin;
    const backend = await mockVatRates(page, [
      { countryCode: 'PL', countryName: 'Poland', rate: 23, updatedAt: '2026-11-01T10:00:00Z' },
      { countryCode: 'DE', countryName: 'Germany', rate: 19, updatedAt: '2026-11-01T10:00:00Z' },
    ]);
    const vatRates = new AdminVatRatesPage(page);
    await vatRates.goto();
    await expect(vatRates.rate('PL')).toHaveText('23%');

    // when - an out-of-range rate
    await vatRates.editRate('PL', '55');

    // then
    await expect(vatRates.rateError('PL')).toHaveText('Rate must be between 0 and 50');
    expect(backend.updates).toHaveLength(0);

    // when - a valid rate
    await page.getByTestId('admin-vat-edit-PL-rate').fill('8.5');
    await page.getByTestId('admin-vat-edit-PL-save').click();

    // then
    await expect(vatRates.rate('PL')).toHaveText('8.5%');
    expect(backend.updates).toEqual([{ countryCode: 'PL', body: { countryName: 'Poland', rate: 8.5 } }]);
  });
});
