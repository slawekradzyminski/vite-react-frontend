import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { currencies } from '../lib/api';
import {
  BASE_CURRENCY,
  USD,
  formatUsdAs,
  readSelectedCurrency,
  subscribeToCurrency,
  type DisplayCurrency,
} from '../lib/money';
import type { Currency } from '../types/commerce';

export const CURRENCIES_QUERY_KEY = ['currencies'] as const;
// Rates change when an administrator edits them, which is rare; an hour keeps every
// price display on one cached list.
const RATES_STALE_TIME = 60 * 60 * 1000;

export function useSelectedCurrency() {
  return useSyncExternalStore(subscribeToCurrency, readSelectedCurrency, () => BASE_CURRENCY);
}

export function toDisplayCurrency(currency: Currency): DisplayCurrency | undefined {
  if (!currency.code || !(Number(currency.rateToUsd) > 0)) return undefined;
  return { code: currency.code, symbol: currency.symbol || currency.code, rateToUsd: Number(currency.rateToUsd) };
}

export function useCurrencies(enabled = true) {
  return useQuery({
    queryKey: CURRENCIES_QUERY_KEY,
    queryFn: async () => (await currencies.list()).data,
    staleTime: RATES_STALE_TIME,
    retry: false,
    enabled,
  });
}

/**
 * Formats USD amounts in the shopper's display currency. Rates are only requested once a
 * currency other than USD is selected; until they arrive, or when the selected code is
 * unknown, amounts stay in USD rather than showing a wrong conversion.
 */
export function useMoney() {
  const code = useSelectedCurrency();
  const converting = code !== BASE_CURRENCY;
  const rates = useCurrencies(converting);
  const list = rates?.data;
  const currency = useMemo(() => {
    if (!converting) return USD;
    const match = Array.isArray(list) ? list.find((item) => item.code === code) : undefined;
    return match ? toDisplayCurrency(match) : undefined;
  }, [code, converting, list]);
  const formatMoney = useCallback((amountUsd: number) => formatUsdAs(amountUsd, currency), [currency]);
  const active = currency ?? USD;

  return {
    /** The currency amounts are shown in right now. */
    currency: active,
    /** True when amounts are converted from USD for display. */
    isConverted: active.code !== BASE_CURRENCY,
    formatMoney,
  };
}
