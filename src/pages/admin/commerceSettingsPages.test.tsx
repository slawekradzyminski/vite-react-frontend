import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminGiftCardsPage } from './giftCardsPage';
import { AdminVatRatesPage } from './vatRatesPage';
import { AdminCurrenciesPage } from './currenciesPage';
import { AdminPaymentsPage } from './paymentsPage';
import { AdminWebhooksPage } from './webhooksPage';

vi.mock('../../components/admin/AdminGiftCards', () => ({ AdminGiftCards: () => 'component:AdminGiftCards' }));
vi.mock('../../components/admin/AdminVatRates', () => ({ AdminVatRates: () => 'component:AdminVatRates' }));
vi.mock('../../components/admin/AdminCurrencies', () => ({ AdminCurrencies: () => 'component:AdminCurrencies' }));
vi.mock('../../components/admin/AdminPayments', () => ({ AdminPayments: () => 'component:AdminPayments' }));
vi.mock('../../components/admin/AdminWebhooks', () => ({ AdminWebhooks: () => 'component:AdminWebhooks' }));

describe('commerce settings admin pages', () => {
  it.each([
    [AdminGiftCardsPage, 'component:AdminGiftCards', 'Gift cards'],
    [AdminVatRatesPage, 'component:AdminVatRates', 'VAT rates'],
    [AdminCurrenciesPage, 'component:AdminCurrencies', 'Currencies'],
    [AdminPaymentsPage, 'component:AdminPayments', 'Payments'],
    [AdminWebhooksPage, 'component:AdminWebhooks', 'Webhooks'],
  ])('renders %#: %s with the document title "%s"', (Page, component, title) => {
    // given / when
    render(<Page />);

    // then
    expect(screen.getByText(component)).toBeInTheDocument();
    expect(document.title).toBe(`${title} – Awesome Testing`);
  });
});
