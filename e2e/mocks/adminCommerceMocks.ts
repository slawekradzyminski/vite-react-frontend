import type { Page } from '@playwright/test';
import { fulfillWithSchema, type BackendSchema } from './backendContract';

type GiftCard = BackendSchema<'GiftCardDto'>;
type VatRate = BackendSchema<'VatRateDto'>;
type Currency = BackendSchema<'CurrencyDto'>;

export interface ListMockOptions {
  /** Delays list responses until `releaseFirstList()`, each answering with the data from when it was requested. */
  holdFirstList?: boolean;
}

// A slow first load: every list response requested before release() is built when the request arrives
// but delivered only on release(), like other components on the page sharing the same endpoint.
function firstListGate(enabled: boolean) {
  let release!: () => void;
  const released = new Promise<void>((resolve) => { release = resolve; });
  return {
    release,
    wait: () => (enabled ? released : Promise.resolve()),
  };
}

// The backend reads a `...Z` LocalDateTime by dropping the zone, so it stores and returns UTC wall time.
const asBackendLocalDateTime = (value?: string | null) => (value ? value.replace(/(\.\d+)?Z$/, '') : null);

export const ISSUED_GIFT_CARD_CODE = 'GC-E2E1-MOCK';

// In-memory admin gift card endpoints: the list starts empty and grows with each issue.
export async function mockAdminGiftCards(page: Page) {
  const cards: GiftCard[] = [];
  const requests: BackendSchema<'GiftCardCreateDto'>[] = [];

  await page.route(/\/api\/v1\/admin\/gift-cards(\?.*)?$/, (route) => {
    if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() ?? '{}');
      requests.push(body);
      const card: GiftCard = {
        code: ISSUED_GIFT_CARD_CODE,
        initialAmount: body.amount,
        balance: body.amount,
        status: 'ACTIVE',
        recipientUsername: body.recipientUsername ?? null,
        note: body.note ?? null,
        expiresAt: asBackendLocalDateTime(body.expiresAt),
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

  return { cards, requests };
}

// In-memory VAT rate endpoints; PUT replaces a country's rate and records the request.
export async function mockVatRates(page: Page, initial: VatRate[], options: ListMockOptions = {}) {
  const rates = [...initial];
  const updates: { countryCode: string; body: BackendSchema<'VatRateRequestDto'> }[] = [];
  const firstList = firstListGate(options.holdFirstList ?? false);

  await page.route('**/api/v1/vat-rates', async (route) => {
    const snapshot = [...rates];
    await firstList.wait();
    return fulfillWithSchema(route, 'VatRateDto', snapshot);
  });

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

  return { rates, updates, releaseFirstList: firstList.release };
}

// In-memory currency endpoints; PUT replaces a currency and records the request.
export async function mockAdminCurrencies(page: Page, initial: Currency[], options: ListMockOptions = {}) {
  const currencies = [...initial];
  const updates: { code: string; body: BackendSchema<'CurrencyRequestDto'> }[] = [];
  const firstList = firstListGate(options.holdFirstList ?? false);

  await page.route('**/api/v1/currencies', async (route) => {
    const snapshot = [...currencies];
    await firstList.wait();
    return fulfillWithSchema(route, 'CurrencyDto', snapshot);
  });

  await page.route(/\/api\/v1\/admin\/currencies\/[A-Z]{3}$/, (route) => {
    const code = route.request().url().split('/').pop() as string;
    const body = JSON.parse(route.request().postData() ?? '{}');
    updates.push({ code, body });
    const updated: Currency = { code, name: body.name, symbol: body.symbol, rateToUsd: body.rateToUsd, updatedAt: new Date().toISOString() };
    const index = currencies.findIndex((currency) => currency.code === code);
    if (index >= 0) currencies[index] = updated;
    else currencies.push(updated);
    return fulfillWithSchema(route, 'CurrencyDto', updated, index >= 0 ? 200 : 201);
  });

  return { currencies, updates, releaseFirstList: firstList.release };
}
