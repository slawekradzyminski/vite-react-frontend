import { formatPrice } from './format';

// Prices, carts and orders are always USD. Another currency is a display conversion only:
// checkout and payment still charge the USD amount.
export const BASE_CURRENCY = 'USD';
export const CURRENCY_STORAGE_KEY = 'displayCurrency';
const CURRENCY_CODE = /^[A-Z]{3}$/;

export interface DisplayCurrency {
  code: string;
  symbol: string;
  /** Value of one unit in USD, as returned by GET /api/v1/currencies. */
  rateToUsd: number;
}

export const USD: DisplayCurrency = { code: BASE_CURRENCY, symbol: '$', rateToUsd: 1 };

/** Rounds half away from zero to two decimals, like the backend's HALF_UP conversions. */
export function roundHalfUp(value: number) {
  const scaled = Math.abs(value) * 100;
  // The epsilon absorbs binary noise such as 1.005 * 100 = 100.49999999999999.
  const rounded = Math.round(scaled + scaled * Number.EPSILON + Number.EPSILON) / 100;
  return value < 0 ? -rounded : rounded;
}

export function convertFromUsd(amountUsd: number, rateToUsd: number) {
  return roundHalfUp(amountUsd / rateToUsd);
}

const numberFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Formats an amount that is already in `currency`: one-character symbols lead ("€92.59"), longer ones follow ("92.59 zł"). */
export function formatInCurrency(amount: number, currency: Pick<DisplayCurrency, 'code' | 'symbol'>) {
  if (currency.code === BASE_CURRENCY) return formatPrice(amount);
  const sign = amount < 0 ? '-' : '';
  const digits = numberFormatter.format(Math.abs(amount));
  const symbol = currency.symbol || currency.code;
  return symbol.length === 1 ? `${sign}${symbol}${digits}` : `${sign}${digits} ${symbol}`;
}

/** Converts a USD amount for display; without a usable rate it stays in USD. */
export function formatUsdAs(amountUsd: number, currency: DisplayCurrency | undefined) {
  if (!currency || currency.code === BASE_CURRENCY || !(currency.rateToUsd > 0)) return formatPrice(amountUsd);
  return formatInCurrency(convertFromUsd(amountUsd, currency.rateToUsd), currency);
}

/** A tax rate in percent without trailing zeros: 23 -> "23%", 7.5 -> "7.5%". */
export function formatPercent(rate: number) {
  return `${Number(rate.toFixed(2))}%`;
}

export function normaliseCurrencyCode(value: string | null | undefined) {
  const code = value?.trim().toUpperCase() ?? '';
  return CURRENCY_CODE.test(code) ? code : BASE_CURRENCY;
}

// The selection is a per-browser preference. Storage can be unavailable (private mode,
// blocked cookies), so every access is guarded and the in-memory value still works.
let selected: string | null = null;
const listeners = new Set<() => void>();

export function readSelectedCurrency() {
  if (selected === null) {
    try {
      selected = normaliseCurrencyCode(window.localStorage.getItem(CURRENCY_STORAGE_KEY));
    } catch {
      selected = BASE_CURRENCY;
    }
  }
  return selected;
}

export function selectCurrency(code: string) {
  selected = normaliseCurrencyCode(code);
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, selected);
  } catch {
    // Keep the in-memory selection for this tab.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeToCurrency(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== CURRENCY_STORAGE_KEY) return;
    selected = normaliseCurrencyCode(event.newValue);
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Test helper: forgets the cached selection so the next read goes to storage again. */
export function resetSelectedCurrencyCache() {
  selected = null;
}
