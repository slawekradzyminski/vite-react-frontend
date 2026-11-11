import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { currencies } from '../../lib/api';
import { resetSelectedCurrencyCache } from '../../lib/money';
import { OrderVat } from './OrderVat';

vi.mock('../../lib/api', () => ({ currencies: { list: vi.fn() } }));

describe('OrderVat', () => {
  afterEach(() => {
    localStorage.clear();
    resetSelectedCurrencyCache();
  });

  it('shows the rate, country, VAT and net amount', () => {
    // when
    renderWithProviders(<OrderVat order={{ totalAmount: 99.99, netAmount: 81.29, taxAmount: 18.7, taxRate: 23, taxCountry: 'PL' }} />);

    // then
    expect(screen.getByTestId('order-details-vat')).toHaveTextContent('Includes VAT 23% (PL): $18.70, net: $81.29');
  });

  it('derives the net amount and omits an unknown country', () => {
    renderWithProviders(<OrderVat order={{ totalAmount: 120, taxAmount: 20, taxRate: 20, taxCountry: null }} />);

    expect(screen.getByTestId('order-details-vat')).toHaveTextContent('Includes VAT 20%: $20.00, net: $100.00');
    expect(screen.queryByTestId('order-details-vat-country')).not.toBeInTheDocument();
  });

  it('renders nothing for orders without a VAT breakdown', () => {
    renderWithProviders(<OrderVat order={{ totalAmount: 50, taxAmount: null, taxRate: null }} />);
    expect(screen.queryByTestId('order-details-vat')).not.toBeInTheDocument();
  });

  it('converts the amounts into the display currency', async () => {
    // given
    localStorage.setItem('displayCurrency', 'EUR');
    vi.mocked(currencies.list).mockResolvedValue({ data: [{ code: 'EUR', symbol: '€', rateToUsd: 1.08 }] } as never);

    // when
    renderWithProviders(<OrderVat order={{ totalAmount: 108, netAmount: 87.8, taxAmount: 20.2, taxRate: 23, taxCountry: 'PL' }} />);

    // then
    await waitFor(() => expect(screen.getByTestId('order-details-vat-amount')).toHaveTextContent('€18.70'));
    expect(screen.getByTestId('order-details-vat-net')).toHaveTextContent('€81.30');
  });
});
