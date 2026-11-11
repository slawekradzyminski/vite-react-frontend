import type { Page } from '@playwright/test';
import { fulfillWithSchema, type BackendSchema } from './backendContract';

export const SEEDED_CURRENCIES: BackendSchema<'CurrencyDto'>[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToUsd: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', rateToUsd: 1.08 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', rateToUsd: 0.25 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rateToUsd: 1.27 },
];

export const currencyMocks = {
  async mockCurrencies(page: Page, currencies = SEEDED_CURRENCIES) {
    await page.route('**/api/v1/currencies', async (route) => {
      await fulfillWithSchema(route, 'CurrencyDto', currencies);
    });
  },
};
