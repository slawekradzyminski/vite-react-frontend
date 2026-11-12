import { test, expect } from '../fixtures/mocked-session.fixture';
import { fulfillWithSchema } from '../mocks/backendContract';
import { ISSUED_GIFT_CARD_CODE, mockAdminCurrencies, mockAdminGiftCards, mockVatRates } from '../mocks/adminCommerceMocks';
import { AdminCurrenciesPage, AdminGiftCardsPage, AdminVatRatesPage } from '../pages/admin-commerce.page.object';

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

  test('a VAT rate saved before the first list response arrived is listed', async ({ mockedAdmin }) => {
    // given: the first list request started before the save and answers with the old list
    const { page } = mockedAdmin;
    const backend = await mockVatRates(page, [
      { countryCode: 'PL', countryName: 'Poland', rate: 23, updatedAt: '2026-11-01T10:00:00Z' },
    ], { holdFirstList: true });
    const vatRates = new AdminVatRatesPage(page);
    await vatRates.goto();
    await expect(page.getByTestId('admin-vat-rates-loading')).toBeVisible();

    // when
    await vatRates.addCountry('XU', 'Raced Land', '9');
    await expect.poll(() => backend.updates).toEqual([{ countryCode: 'XU', body: { countryName: 'Raced Land', rate: 9 } }]);
    backend.releaseFirstList();

    // then
    await expect(vatRates.rate('XU')).toHaveText('9%');
    await expect(vatRates.rate('PL')).toHaveText('23%');
  });

  test('a currency saved before the first list response arrived is listed', async ({ mockedAdmin }) => {
    // given: the first list request started before the save and answers with the old list
    const { page } = mockedAdmin;
    const backend = await mockAdminCurrencies(page, [
      { code: 'USD', name: 'US Dollar', symbol: '$', rateToUsd: 1, updatedAt: '2026-11-01T10:00:00Z' },
    ], { holdFirstList: true });
    const currencies = new AdminCurrenciesPage(page);
    await currencies.goto();

    // when
    await currencies.addCurrency('XUU', 'Raced Unit', 'R', '0.5');
    await expect.poll(() => backend.updates).toEqual([{ code: 'XUU', body: { name: 'Raced Unit', symbol: 'R', rateToUsd: 0.5 } }]);
    backend.releaseFirstList();

    // then
    await expect(currencies.rate('XUU')).toHaveText('0.5');
    await expect(currencies.rate('USD')).toHaveText('1');
  });
});

test.describe('Admin gift card expiry in a browser east of UTC (mocked backend)', () => {
  test.use({ timezoneId: 'Pacific/Auckland' });

  test('the picked expiry is sent as a UTC instant and shown back in local time', async ({ mockedAdmin }) => {
    // given: 10:00 on 1 January in Auckland (NZDT, UTC+13) is 21:00 UTC on 31 December
    const { page } = mockedAdmin;
    const backend = await mockAdminGiftCards(page);
    const giftCards = new AdminGiftCardsPage(page);
    await giftCards.goto();
    await expect(page.getByTestId('admin-gift-cards-empty')).toBeVisible();

    // when
    await giftCards.issueCard('20', undefined, '2999-01-01T10:00');

    // then
    await expect(giftCards.issuedCode).toHaveText(ISSUED_GIFT_CARD_CODE);
    expect(backend.requests[0].expiresAt).toBe('2998-12-31T21:00:00.000Z');
    expect(backend.cards[0].expiresAt).toBe('2998-12-31T21:00:00');
    const shown = await page.evaluate(() => new Date(2999, 0, 1, 10, 0).toLocaleString());
    await expect(giftCards.expiry(ISSUED_GIFT_CARD_CODE)).toHaveText(shown);
  });
});
