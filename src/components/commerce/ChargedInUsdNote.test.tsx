import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { currencies } from '../../lib/api';
import { resetSelectedCurrencyCache } from '../../lib/money';
import { ChargedInUsdNote } from './ChargedInUsdNote';

vi.mock('../../lib/api', () => ({ currencies: { list: vi.fn() } }));

describe('ChargedInUsdNote', () => {
  afterEach(() => {
    localStorage.clear();
    resetSelectedCurrencyCache();
  });

  it('stays hidden while prices are shown in USD', () => {
    renderWithProviders(<ChargedInUsdNote amountUsd={10} />);
    expect(screen.queryByTestId('charged-in-usd-note')).not.toBeInTheDocument();
  });

  it('tells the shopper the USD amount that is charged', async () => {
    // given
    localStorage.setItem('displayCurrency', 'GBP');
    vi.mocked(currencies.list).mockResolvedValue({ data: [{ code: 'GBP', symbol: '£', rateToUsd: 1.27 }] } as never);

    // when
    renderWithProviders(<ChargedInUsdNote amountUsd={1234.5} testId="checkout-charged-in-usd" />);

    // then
    expect(await screen.findByTestId('checkout-charged-in-usd')).toHaveTextContent('Charged in USD: $1,234.50. GBP prices are estimates.');
  });
});
