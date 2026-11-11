import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CURRENCY_STORAGE_KEY,
  USD,
  convertFromUsd,
  formatInCurrency,
  formatPercent,
  formatUsdAs,
  normaliseCurrencyCode,
  readSelectedCurrency,
  resetSelectedCurrencyCache,
  roundHalfUp,
  selectCurrency,
  subscribeToCurrency,
} from './money';

const EUR = { code: 'EUR', symbol: '€', rateToUsd: 1.08 };
const PLN = { code: 'PLN', symbol: 'zł', rateToUsd: 0.25 };

describe('money', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    resetSelectedCurrencyCache();
  });

  describe('roundHalfUp', () => {
    it('rounds halves away from zero despite binary representation errors', () => {
      // given / when / then
      expect(roundHalfUp(1.005)).toBe(1.01);
      expect(roundHalfUp(2.675)).toBe(2.68);
      expect(roundHalfUp(92.592592)).toBe(92.59);
      expect(roundHalfUp(0.125)).toBe(0.13);
      expect(roundHalfUp(-0.125)).toBe(-0.13);
      expect(roundHalfUp(10)).toBe(10);
    });
  });

  describe('convertFromUsd', () => {
    it('divides by the value of one unit in USD and rounds to cents', () => {
      // given a euro worth 1.08 USD and a zloty worth 0.25 USD
      // when / then
      expect(convertFromUsd(100, 1.08)).toBe(92.59);
      expect(convertFromUsd(19.99, 0.25)).toBe(79.96);
      expect(convertFromUsd(0, 1.08)).toBe(0);
    });
  });

  describe('formatInCurrency', () => {
    it('puts one-character symbols in front and longer symbols after the amount', () => {
      expect(formatInCurrency(1234.5, EUR)).toBe('€1,234.50');
      expect(formatInCurrency(79.96, PLN)).toBe('79.96 zł');
      expect(formatInCurrency(5, { code: 'CHF', symbol: 'CHF' })).toBe('5.00 CHF');
      expect(formatInCurrency(-5, EUR)).toBe('-€5.00');
    });

    it('falls back to the code without a symbol and keeps USD identical to formatPrice', () => {
      expect(formatInCurrency(5, { code: 'SEK', symbol: '' })).toBe('5.00 SEK');
      expect(formatInCurrency(1999.99, USD)).toBe('$1,999.99');
    });
  });

  describe('formatUsdAs', () => {
    it('converts into the display currency', () => {
      expect(formatUsdAs(100, EUR)).toBe('€92.59');
      expect(formatUsdAs(19.99, PLN)).toBe('79.96 zł');
    });

    it('stays in USD without a currency, for USD, or with an unusable rate', () => {
      expect(formatUsdAs(100, undefined)).toBe('$100.00');
      expect(formatUsdAs(100, USD)).toBe('$100.00');
      expect(formatUsdAs(100, { ...EUR, rateToUsd: 0 })).toBe('$100.00');
      expect(formatUsdAs(100, { ...EUR, rateToUsd: Number.NaN })).toBe('$100.00');
    });
  });

  it('formats tax rates without trailing zeros', () => {
    expect(formatPercent(23)).toBe('23%');
    expect(formatPercent(7.5)).toBe('7.5%');
    expect(formatPercent(8.125)).toBe('8.13%');
  });

  it('accepts only three-letter codes and defaults to USD', () => {
    expect(normaliseCurrencyCode(' eur ')).toBe('EUR');
    expect(normaliseCurrencyCode('EURO')).toBe('USD');
    expect(normaliseCurrencyCode(null)).toBe('USD');
    expect(normaliseCurrencyCode('')).toBe('USD');
  });

  describe('selection', () => {
    it('defaults to USD and restores a stored choice', () => {
      // given
      expect(readSelectedCurrency()).toBe('USD');
      resetSelectedCurrencyCache();
      localStorage.setItem(CURRENCY_STORAGE_KEY, 'GBP');

      // when / then
      expect(readSelectedCurrency()).toBe('GBP');
    });

    it('persists a selection and notifies subscribers', () => {
      // given
      const listener = vi.fn();
      const unsubscribe = subscribeToCurrency(listener);

      // when
      selectCurrency('eur');

      // then
      expect(readSelectedCurrency()).toBe('EUR');
      expect(localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe('EUR');
      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();
      selectCurrency('PLN');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('keeps working in memory when storage throws', () => {
      // given
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });

      // when / then
      expect(readSelectedCurrency()).toBe('USD');
      expect(() => selectCurrency('EUR')).not.toThrow();
      expect(readSelectedCurrency()).toBe('EUR');
    });

    it('follows a selection made in another tab', () => {
      // given
      const listener = vi.fn();
      const unsubscribe = subscribeToCurrency(listener);

      // when
      window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated', newValue: 'EUR' }));
      window.dispatchEvent(new StorageEvent('storage', { key: CURRENCY_STORAGE_KEY, newValue: 'CHF' }));

      // then
      expect(listener).toHaveBeenCalledTimes(1);
      expect(readSelectedCurrency()).toBe('CHF');
      unsubscribe();
    });
  });
});
