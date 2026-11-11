import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { currencies } from '../../lib/api';
import { resetSelectedCurrencyCache } from '../../lib/money';
import { CurrencySelector } from './CurrencySelector';

vi.mock('../../lib/api', () => ({ currencies: { list: vi.fn() } }));

const renderSelector = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <CurrencySelector />
  </QueryClientProvider>,
);

describe('CurrencySelector', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorage.clear();
    resetSelectedCurrencyCache();
  });

  it('lists the backend currencies with USD selected by default', async () => {
    // given
    vi.mocked(currencies.list).mockResolvedValue({ data: [
      { code: 'USD', symbol: '$', rateToUsd: 1 },
      { code: 'EUR', symbol: '€', rateToUsd: 1.08 },
      { code: 'CHF', symbol: 'CHF', rateToUsd: 1.13 },
    ] } as never);

    // when
    renderSelector();

    // then
    const select = screen.getByRole('combobox', { name: 'Display currency' });
    expect(select).toHaveValue('USD');
    await waitFor(() => expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['USD ($)', 'EUR (€)', 'CHF']));
  });

  it('remembers the chosen currency', async () => {
    // given
    vi.mocked(currencies.list).mockResolvedValue({ data: [{ code: 'USD', symbol: '$', rateToUsd: 1 }, { code: 'GBP', symbol: '£', rateToUsd: 1.27 }] } as never);
    renderSelector();
    await screen.findByRole('option', { name: 'GBP (£)' });

    // when
    await userEvent.selectOptions(screen.getByTestId('currency-selector'), 'GBP');

    // then
    expect(screen.getByTestId('currency-selector')).toHaveValue('GBP');
    expect(localStorage.getItem('displayCurrency')).toBe('GBP');
  });

  it('keeps USD and the stored choice when rates are unavailable', async () => {
    // given
    localStorage.setItem('displayCurrency', 'EUR');
    vi.mocked(currencies.list).mockRejectedValue(new Error('offline'));

    // when
    renderSelector();

    // then
    await waitFor(() => expect(screen.getByTestId('currency-selector')).toHaveAttribute('title', 'Exchange rates are unavailable; prices stay in USD.'));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['USD', 'EUR']);
    expect(screen.getByTestId('currency-selector')).toHaveValue('EUR');
  });
});
