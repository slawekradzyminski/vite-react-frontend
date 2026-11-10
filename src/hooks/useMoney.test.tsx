import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { currencies } from '../lib/api';
import { resetSelectedCurrencyCache, selectCurrency } from '../lib/money';
import { toDisplayCurrency, useMoney } from './useMoney';

vi.mock('../lib/api', () => ({ currencies: { list: vi.fn() } }));

const RATES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToUsd: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', rateToUsd: 1.08 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', rateToUsd: 0.25 },
];

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useMoney', () => {
  beforeEach(() => {
    vi.mocked(currencies.list).mockResolvedValue({ data: RATES } as never);
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    resetSelectedCurrencyCache();
  });

  it('formats USD without requesting rates by default', () => {
    // when
    const { result } = renderHook(() => useMoney(), { wrapper });

    // then
    expect(result.current.formatMoney(1234.5)).toBe('$1,234.50');
    expect(result.current.isConverted).toBe(false);
    expect(currencies.list).not.toHaveBeenCalled();
  });

  it('converts once the rates for the stored currency arrive', async () => {
    // given
    localStorage.setItem('displayCurrency', 'EUR');

    // when
    const { result } = renderHook(() => useMoney(), { wrapper });

    // then: USD until the rates load, never a wrong conversion
    expect(result.current.formatMoney(100)).toBe('$100.00');
    await waitFor(() => expect(result.current.formatMoney(100)).toBe('€92.59'));
    expect(result.current.isConverted).toBe(true);
    expect(result.current.currency.code).toBe('EUR');
  });

  it('switches when the shopper picks another currency', async () => {
    // given
    const { result } = renderHook(() => useMoney(), { wrapper });

    // when
    act(() => selectCurrency('PLN'));

    // then
    await waitFor(() => expect(result.current.formatMoney(19.99)).toBe('79.96 zł'));
  });

  it('stays in USD for a code the backend does not know or when rates fail', async () => {
    // given
    localStorage.setItem('displayCurrency', 'JPY');
    const { result } = renderHook(() => useMoney(), { wrapper });

    // then
    await waitFor(() => expect(currencies.list).toHaveBeenCalled());
    expect(result.current.formatMoney(10)).toBe('$10.00');
    expect(result.current.isConverted).toBe(false);
  });

  it('ignores currencies without a usable rate', () => {
    expect(toDisplayCurrency({ code: 'XXX', rateToUsd: 0 })).toBeUndefined();
    expect(toDisplayCurrency({ rateToUsd: 1 })).toBeUndefined();
    expect(toDisplayCurrency({ code: 'CHF', rateToUsd: 1.13 })).toEqual({ code: 'CHF', symbol: 'CHF', rateToUsd: 1.13 });
  });
});
