import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currencies } from '../../lib/api';
import { AdminCurrencies } from './AdminCurrencies';
import { axiosFailure, ok } from '../../test/webhookFixtures';
import { renderWithQuery } from '../../test/queryWrapper';

vi.mock('../../lib/api', () => ({
  currencies: { list: vi.fn(), upsert: vi.fn() },
}));

const list = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToUsd: 1, updatedAt: '2026-11-01T10:00:00Z' },
  { code: 'EUR', name: 'Euro', symbol: '€', rateToUsd: 1.08, updatedAt: '2026-11-01T10:00:00Z' },
];

describe('AdminCurrencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(currencies.list).mockResolvedValue(ok(list) as never);
    vi.mocked(currencies.upsert).mockResolvedValue(ok(list[1]) as never);
  });

  it('lists currencies and marks USD as the base', async () => {
    // given / when
    renderWithQuery(<AdminCurrencies />);

    // then
    expect(await screen.findByTestId('admin-currency-rate-EUR')).toHaveTextContent('1.08');
    expect(within(screen.getByTestId('admin-currency-row-USD')).getByTestId('admin-currency-base')).toHaveTextContent('Base');
  });

  it('edits the rate, name and symbol of a currency', async () => {
    // given
    const user = userEvent.setup();
    renderWithQuery(<AdminCurrencies />);

    // when
    await user.click(await screen.findByRole('button', { name: 'Edit currency EUR' }));
    const form = screen.getByRole('form', { name: 'Edit currency EUR' });
    await user.clear(within(form).getByLabelText('Rate to USD'));
    await user.type(within(form).getByLabelText('Rate to USD'), '1.1');
    await user.clear(within(form).getByLabelText('Name'));
    await user.type(within(form).getByLabelText('Name'), 'Euro (EU)');
    await user.clear(within(form).getByLabelText('Symbol'));
    await user.type(within(form).getByLabelText('Symbol'), 'EUR€');
    await user.click(within(form).getByRole('button', { name: 'Save' }));

    // then
    await waitFor(() => expect(currencies.upsert).toHaveBeenCalledWith('EUR', { name: 'Euro (EU)', symbol: 'EUR€', rateToUsd: 1.1 }));
    await waitFor(() => expect(screen.queryByTestId('admin-currency-edit-EUR-form')).not.toBeInTheDocument());
  });

  it('locks the USD rate to 1', async () => {
    // given
    const user = userEvent.setup();
    renderWithQuery(<AdminCurrencies />);

    // when
    await user.click(await screen.findByTestId('admin-currency-edit-USD'));

    // then
    const rate = screen.getByTestId('admin-currency-edit-USD-rate');
    expect(rate).toHaveAttribute('readonly');
    expect(rate).toHaveValue('1');
    expect(rate).toHaveAccessibleDescription('Base currency, locked to 1.');

    // when
    await user.click(screen.getByTestId('admin-currency-edit-USD-save'));

    // then
    await waitFor(() => expect(currencies.upsert).toHaveBeenCalledWith('USD', { name: 'US Dollar', symbol: '$', rateToUsd: 1 }));
  });

  it('validates a new currency and rejects a USD rate other than 1', async () => {
    // given
    const user = userEvent.setup();
    renderWithQuery(<AdminCurrencies />);

    // when
    await user.type(screen.getByTestId('admin-currency-new-code'), 'usd');
    await user.type(screen.getByTestId('admin-currency-new-name'), 'Dollar');
    await user.type(screen.getByTestId('admin-currency-new-symbol'), '$');
    await user.type(screen.getByTestId('admin-currency-new-rate'), '2');
    await user.click(screen.getByTestId('admin-currency-new-save'));

    // then
    expect(await screen.findByTestId('admin-currency-new-rateToUsd-error')).toHaveTextContent('USD is the base currency and its rate must stay 1');
    expect(currencies.upsert).not.toHaveBeenCalled();

    // when
    await user.click(screen.getByTestId('admin-currency-edit-EUR'));
    await user.click(screen.getByTestId('admin-currency-edit-EUR-cancel'));

    // then
    expect(screen.queryByTestId('admin-currency-edit-EUR-form')).not.toBeInTheDocument();
  });

  it('adds a currency and shows a backend error', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(currencies.upsert).mockResolvedValueOnce(ok(list[1]) as never).mockRejectedValueOnce(axiosFailure(400, { message: 'Invalid code' }));
    renderWithQuery(<AdminCurrencies />);
    const fill = async () => {
      await user.type(screen.getByTestId('admin-currency-new-code'), 'gbp');
      await user.type(screen.getByTestId('admin-currency-new-name'), 'Pound');
      await user.type(screen.getByTestId('admin-currency-new-symbol'), '£');
      await user.type(screen.getByTestId('admin-currency-new-rate'), '1.27');
      await user.click(screen.getByTestId('admin-currency-new-save'));
    };

    // when
    await fill();

    // then
    await waitFor(() => expect(currencies.upsert).toHaveBeenCalledWith('GBP', { name: 'Pound', symbol: '£', rateToUsd: 1.27 }));
    await waitFor(() => expect(screen.getByTestId('admin-currency-new-code')).toHaveValue(''));

    // when
    await fill();

    // then
    expect(await screen.findByTestId('admin-currency-new-error')).toHaveTextContent('Invalid code');
  });

  it('shows empty and error states', async () => {
    // given
    vi.mocked(currencies.list).mockResolvedValueOnce(ok([]) as never);
    const { unmount } = renderWithQuery(<AdminCurrencies />);

    // then
    expect(await screen.findByTestId('admin-currencies-empty')).toBeInTheDocument();
    unmount();

    // given
    vi.mocked(currencies.list).mockRejectedValueOnce(new Error('down'));
    renderWithQuery(<AdminCurrencies />);

    // then
    expect(await screen.findByTestId('admin-currencies-error')).toBeInTheDocument();
  });
});
