import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vatRates } from '../../lib/api';
import { AdminVatRates } from './AdminVatRates';
import { axiosFailure, ok } from '../../test/webhookFixtures';
import { renderWithQuery } from '../../test/queryWrapper';

vi.mock('../../lib/api', () => ({
  vatRates: { list: vi.fn(), upsert: vi.fn() },
}));

const rates = [
  { countryCode: 'PL', countryName: 'Poland', rate: 23, updatedAt: '2026-11-01T10:00:00Z' },
  { countryCode: 'DE', countryName: 'Germany', rate: 19, updatedAt: '2026-11-01T10:00:00Z' },
];

describe('AdminVatRates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vatRates.list).mockResolvedValue(ok(rates) as never);
    vi.mocked(vatRates.upsert).mockResolvedValue(ok(rates[0]) as never);
  });

  it('lists the rates', async () => {
    // given / when
    renderWithQuery(<AdminVatRates />);

    // then
    expect(await screen.findByTestId('admin-vat-rate-PL')).toHaveTextContent('23%');
    expect(screen.getByTestId('admin-vat-row-DE')).toHaveTextContent('Germany');
  });

  it('edits a rate inline', async () => {
    // given
    const user = userEvent.setup();
    renderWithQuery(<AdminVatRates />);

    // when
    await user.click(await screen.findByRole('button', { name: 'Edit VAT rate for Poland' }));
    const form = screen.getByRole('form', { name: 'Edit VAT rate for PL' });
    expect(within(form).getByLabelText('Country code')).toHaveAttribute('readonly');
    await user.clear(within(form).getByLabelText('Rate (%)'));
    await user.type(within(form).getByLabelText('Rate (%)'), '8.5');
    await user.click(within(form).getByRole('button', { name: 'Save' }));

    // then
    await waitFor(() => expect(vatRates.upsert).toHaveBeenCalledWith('PL', { countryName: 'Poland', rate: 8.5 }));
    await waitFor(() => expect(screen.queryByTestId('admin-vat-edit-PL-form')).not.toBeInTheDocument());
    expect(vatRates.list).toHaveBeenCalledTimes(2);
  });

  it('validates the range and decimals before saving', async () => {
    // given
    const user = userEvent.setup();
    renderWithQuery(<AdminVatRates />);
    await user.click(await screen.findByTestId('admin-vat-edit-PL'));
    const rate = screen.getByTestId('admin-vat-edit-PL-rate');

    // when
    await user.clear(rate);
    await user.type(rate, '50.5');
    await user.click(screen.getByTestId('admin-vat-edit-PL-save'));

    // then
    expect(await screen.findByTestId('admin-vat-edit-PL-rate-error')).toHaveTextContent('Rate must be between 0 and 50');

    // when
    await user.clear(rate);
    await user.type(rate, '7.125');
    await user.click(screen.getByTestId('admin-vat-edit-PL-save'));

    // then
    expect(await screen.findByTestId('admin-vat-edit-PL-rate-error')).toHaveTextContent('Use at most 2 decimal places');
    expect(rate).toHaveAttribute('aria-invalid', 'true');
    expect(vatRates.upsert).not.toHaveBeenCalled();

    // when
    await user.click(screen.getByTestId('admin-vat-edit-PL-cancel'));

    // then
    expect(screen.queryByTestId('admin-vat-edit-PL-form')).not.toBeInTheDocument();
  });

  it('creates a country with an upper-cased code and clears the form', async () => {
    // given
    const user = userEvent.setup();
    renderWithQuery(<AdminVatRates />);

    // when
    await user.type(screen.getByTestId('admin-vat-new-country-code'), 'fr');
    await user.type(screen.getByTestId('admin-vat-new-country-name'), 'France');
    await user.type(screen.getByTestId('admin-vat-new-rate'), '20');
    await user.click(screen.getByTestId('admin-vat-new-save'));

    // then
    await waitFor(() => expect(vatRates.upsert).toHaveBeenCalledWith('FR', { countryName: 'France', rate: 20 }));
    await waitFor(() => expect(screen.getByTestId('admin-vat-new-country-code')).toHaveValue(''));
  });

  it('shows a backend error', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(vatRates.upsert).mockRejectedValue(axiosFailure(400, { message: 'Unknown country code XX' }));
    renderWithQuery(<AdminVatRates />);

    // when
    await user.type(screen.getByTestId('admin-vat-new-country-code'), 'XX');
    await user.type(screen.getByTestId('admin-vat-new-country-name'), 'Nowhere');
    await user.type(screen.getByTestId('admin-vat-new-rate'), '1');
    await user.click(screen.getByTestId('admin-vat-new-save'));

    // then
    expect(await screen.findByTestId('admin-vat-new-error')).toHaveTextContent('Unknown country code XX');
  });

  it('shows empty and error states', async () => {
    // given
    vi.mocked(vatRates.list).mockResolvedValueOnce(ok([]) as never);
    const { unmount } = renderWithQuery(<AdminVatRates />);

    // then
    expect(await screen.findByTestId('admin-vat-rates-empty')).toBeInTheDocument();
    unmount();

    // given
    vi.mocked(vatRates.list).mockRejectedValueOnce(new Error('down'));
    renderWithQuery(<AdminVatRates />);

    // then
    expect(await screen.findByTestId('admin-vat-rates-error')).toBeInTheDocument();
  });

  it('shows a country saved before the first list response arrived', async () => {
    // given: the first list request is still in flight and answers with the list from before the save
    const user = userEvent.setup();
    let answerFirstLoad!: () => void;
    vi.mocked(vatRates.list)
      .mockImplementationOnce(() => new Promise((resolve) => { answerFirstLoad = () => resolve(ok(rates) as never); }))
      .mockResolvedValueOnce(ok([...rates, { countryCode: 'XU', countryName: 'Raced Land', rate: 9, updatedAt: '2026-11-12T10:00:00Z' }]) as never);
    renderWithQuery(<AdminVatRates />);
    expect(screen.getByTestId('admin-vat-rates-loading')).toBeInTheDocument();

    // when
    await user.type(screen.getByTestId('admin-vat-new-country-code'), 'XU');
    await user.type(screen.getByTestId('admin-vat-new-country-name'), 'Raced Land');
    await user.type(screen.getByTestId('admin-vat-new-rate'), '9');
    await user.click(screen.getByTestId('admin-vat-new-save'));
    await waitFor(() => expect(vatRates.upsert).toHaveBeenCalledWith('XU', { countryName: 'Raced Land', rate: 9 }));
    answerFirstLoad();

    // then
    expect(await screen.findByTestId('admin-vat-rate-XU')).toHaveTextContent('9%');
    expect(vatRates.list).toHaveBeenCalledTimes(2);
  });
});
