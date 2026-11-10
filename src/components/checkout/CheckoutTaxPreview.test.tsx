import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { vatRates } from '../../lib/api';
import { CheckoutTaxPreview } from './CheckoutTaxPreview';

vi.mock('../../lib/api', () => ({ vatRates: { preview: vi.fn() }, currencies: { list: vi.fn() } }));

const notFound = Object.assign(new Error('Not found'), { isAxiosError: true, response: { status: 404 } });

describe('CheckoutTaxPreview', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders nothing until a country is entered', () => {
    renderWithProviders(<CheckoutTaxPreview country="  " cartTotal={99.99} />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.queryByTestId('checkout-tax-preview')).not.toBeInTheDocument();
    expect(vatRates.preview).not.toHaveBeenCalled();
  });

  it('asks once the country stops changing and shows the VAT line', async () => {
    // given
    vi.mocked(vatRates.preview).mockResolvedValue({ data: { country: 'PL', rate: 23, taxAmount: 18.7, netAmount: 81.29, totalAmount: 99.99 } } as never);
    const { rerender } = renderWithProviders(<CheckoutTaxPreview country="" cartTotal={99.99} />);

    // when the shopper types, pausing shorter than the debounce
    rerender(<CheckoutTaxPreview country="Pol" cartTotal={99.99} />);
    act(() => { vi.advanceTimersByTime(100); });
    rerender(<CheckoutTaxPreview country="Poland " cartTotal={99.99} />);
    act(() => { vi.advanceTimersByTime(300); });

    // then
    expect(await screen.findByTestId('checkout-tax-preview')).toHaveTextContent('Includes VAT 23% (PL)$18.70');
    expect(vatRates.preview).toHaveBeenCalledTimes(1);
    expect(vatRates.preview).toHaveBeenCalledWith('Poland');
  });

  it('explains that an unknown country is checked out without VAT', async () => {
    // given
    vi.mocked(vatRates.preview).mockRejectedValue(notFound);

    // when
    renderWithProviders(<CheckoutTaxPreview country="Atlantis" cartTotal={10} />);
    act(() => { vi.advanceTimersByTime(300); });

    // then
    expect(await screen.findByTestId('checkout-tax-unavailable')).toHaveTextContent('No VAT rate for "Atlantis"; the order is placed without VAT.');
  });

  it('reports other failures without blocking checkout', async () => {
    vi.mocked(vatRates.preview).mockRejectedValue(new Error('down'));
    renderWithProviders(<CheckoutTaxPreview country="DE" cartTotal={10} />);
    act(() => { vi.advanceTimersByTime(300); });
    expect(await screen.findByTestId('checkout-tax-unavailable')).toHaveTextContent('VAT preview is unavailable right now.');
  });
});
