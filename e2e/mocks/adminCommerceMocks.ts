import type { Page } from '@playwright/test';
import { fulfillWithSchema, type BackendSchema } from './backendContract';

type GiftCard = BackendSchema<'GiftCardDto'>;
type VatRate = BackendSchema<'VatRateDto'>;

export const ISSUED_GIFT_CARD_CODE = 'GC-E2E1-MOCK';

// In-memory admin gift card endpoints: the list starts empty and grows with each issue.
export async function mockAdminGiftCards(page: Page) {
  const cards: GiftCard[] = [];

  await page.route(/\/api\/v1\/admin\/gift-cards(\?.*)?$/, (route) => {
    if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() ?? '{}');
      const card: GiftCard = {
        code: ISSUED_GIFT_CARD_CODE,
        initialAmount: body.amount,
        balance: body.amount,
        status: 'ACTIVE',
        recipientUsername: body.recipientUsername ?? null,
        note: body.note ?? null,
        expiresAt: body.expiresAt ?? null,
        createdBy: 'mocked-admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        transactions: [{ type: 'ISSUED', amount: body.amount, balanceAfter: body.amount, actor: 'mocked-admin', createdAt: new Date().toISOString() }],
      };
      cards.unshift(card);
      return fulfillWithSchema(route, 'GiftCardDto', card, 201);
    }
    return fulfillWithSchema(route, 'PageDtoGiftCardDto', { content: cards, pageNumber: 0, pageSize: 20, totalElements: cards.length, totalPages: cards.length ? 1 : 0 });
  });

  await page.route(/\/api\/v1\/admin\/gift-cards\/[^/?]+$/, (route) => {
    const code = decodeURIComponent(route.request().url().split('/').pop() ?? '');
    const card = cards.find((candidate) => candidate.code === code);
    return card ? fulfillWithSchema(route, 'GiftCardDto', card) : route.fulfill({ status: 404, body: '{}' });
  });

  return { cards };
}

// In-memory VAT rate endpoints; PUT replaces a country's rate and records the request.
export async function mockVatRates(page: Page, initial: VatRate[]) {
  const rates = [...initial];
  const updates: { countryCode: string; body: BackendSchema<'VatRateRequestDto'> }[] = [];

  await page.route('**/api/v1/vat-rates', (route) => fulfillWithSchema(route, 'VatRateDto', rates));

  await page.route(/\/api\/v1\/admin\/vat-rates\/[A-Z]{2}$/, (route) => {
    const countryCode = route.request().url().split('/').pop() as string;
    const body = JSON.parse(route.request().postData() ?? '{}');
    updates.push({ countryCode, body });
    const updated: VatRate = { countryCode, countryName: body.countryName, rate: body.rate, updatedAt: new Date().toISOString() };
    const index = rates.findIndex((rate) => rate.countryCode === countryCode);
    if (index >= 0) rates[index] = updated;
    else rates.push(updated);
    return fulfillWithSchema(route, 'VatRateDto', updated, index >= 0 ? 200 : 201);
  });

  return { rates, updates };
}
