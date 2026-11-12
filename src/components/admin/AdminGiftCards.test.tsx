import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { adminGiftCards } from '../../lib/api';
import type { GiftCard } from '../../types/commerce';
import { AdminGiftCards } from './AdminGiftCards';
import { axiosFailure, ok, page } from '../../test/webhookFixtures';
import { renderWithQuery } from '../../test/queryWrapper';

vi.mock('../../lib/api', () => ({
  adminGiftCards: { list: vi.fn(), get: vi.fn(), create: vi.fn(), disable: vi.fn() },
}));

const card = (overrides: Partial<GiftCard> = {}): GiftCard => ({
  code: 'GC-AAAA-BBBB',
  initialAmount: 50,
  balance: 30,
  status: 'ACTIVE',
  recipientUsername: 'client',
  createdBy: 'admin',
  note: 'Apology',
  expiresAt: null,
  createdAt: '2026-11-01T10:00:00Z',
  transactions: [
    { type: 'ISSUED', amount: 50, balanceAfter: 50, actor: 'admin', createdAt: '2026-11-01T10:00:00Z' },
    { type: 'REDEEMED', amount: -20, balanceAfter: 30, orderId: 12, createdAt: '2026-11-02T10:00:00Z' },
  ],
  ...overrides,
});

describe('AdminGiftCards', () => {
  // An administrator in Auckland (NZDT, UTC+13 in summer); the backend keeps gift card expiries in UTC.
  const originalZone = process.env.TZ;
  beforeAll(() => { process.env.TZ = 'Pacific/Auckland'; });
  afterAll(() => { process.env.TZ = originalZone; });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminGiftCards.list).mockResolvedValue(ok(page([card()], 2)) as never);
  });

  it('lists gift cards and filters by status from the first page', async () => {
    // given
    const user = userEvent.setup();
    renderWithQuery(<AdminGiftCards />);
    expect(await screen.findByTestId('admin-gift-card-row-GC-AAAA-BBBB')).toBeInTheDocument();
    expect(screen.getByTestId('admin-gift-card-balance-GC-AAAA-BBBB')).toHaveTextContent('$30.00');
    expect(screen.getByTestId('admin-gift-card-status-GC-AAAA-BBBB')).toHaveTextContent('ACTIVE');

    // when
    await user.click(screen.getByTestId('admin-gift-cards-next-page'));
    await waitFor(() => expect(adminGiftCards.list).toHaveBeenLastCalledWith(undefined, 1, 20));
    await user.selectOptions(screen.getByLabelText('Status'), 'DISABLED');

    // then
    await waitFor(() => expect(adminGiftCards.list).toHaveBeenLastCalledWith('DISABLED', 0, 20));
  });

  it('shows empty and error states', async () => {
    // given
    vi.mocked(adminGiftCards.list).mockResolvedValueOnce(ok(page([], 0)) as never);

    // when
    const { unmount } = renderWithQuery(<AdminGiftCards />);

    // then
    expect(await screen.findByTestId('admin-gift-cards-empty')).toBeInTheDocument();
    unmount();

    // given
    vi.mocked(adminGiftCards.list).mockRejectedValueOnce(new Error('down'));

    // when
    renderWithQuery(<AdminGiftCards />);

    // then
    expect(await screen.findByTestId('admin-gift-cards-error')).toBeInTheDocument();
  });

  it('issues a gift card and shows its code', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(adminGiftCards.create).mockResolvedValue(ok(card({ code: 'GC-NEW1-CODE', initialAmount: 25, balance: 25 })) as never);
    renderWithQuery(<AdminGiftCards />);

    // when
    await user.type(screen.getByLabelText('Amount (USD)'), '25');
    await user.type(screen.getByLabelText('Recipient username (optional)'), 'client');
    await user.type(screen.getByLabelText('Expires (optional)'), '2999-01-01T10:00');
    await user.type(screen.getByLabelText('Internal note (optional)'), 'Thanks');
    await user.click(screen.getByRole('button', { name: 'Issue gift card' }));

    // then
    expect(adminGiftCards.create).toHaveBeenCalledWith({ amount: 25, recipientUsername: 'client', note: 'Thanks', expiresAt: '2998-12-31T21:00:00.000Z' });
    expect(await screen.findByTestId('admin-gift-card-issued-code')).toHaveTextContent('GC-NEW1-CODE');
    expect(screen.getByTestId('admin-gift-card-issued')).toHaveTextContent('Issued a $25.00 gift card for client');
    expect(screen.getByLabelText('Amount (USD)')).toHaveValue('');
    await waitFor(() => expect(adminGiftCards.list).toHaveBeenCalledTimes(2));
  });

  it('shows a UTC expiry in the browser zone in the list and the details', async () => {
    // given: 21:00 UTC on 31 December is 10:00 on 1 January in Auckland
    const expiring = card({ expiresAt: '2026-12-31T21:00:00' });
    vi.mocked(adminGiftCards.list).mockResolvedValue(ok(page([expiring], 1)) as never);
    vi.mocked(adminGiftCards.get).mockResolvedValue(ok(expiring) as never);
    const user = userEvent.setup();
    const shown = new Date(2027, 0, 1, 10, 0).toLocaleString();
    renderWithQuery(<AdminGiftCards />);

    // when
    expect(await screen.findByTestId('admin-gift-card-expires-GC-AAAA-BBBB')).toHaveTextContent(shown);
    await user.click(screen.getByTestId('admin-gift-card-view-GC-AAAA-BBBB'));

    // then
    expect(await screen.findByTestId('admin-gift-card-details-expires')).toHaveTextContent(shown);
  });

  it('sends optional fields as null and validates the amount', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(adminGiftCards.create).mockResolvedValue(ok(card({ recipientUsername: null })) as never);
    renderWithQuery(<AdminGiftCards />);

    // when - invalid
    await user.type(screen.getByLabelText('Amount (USD)'), '5000');
    await user.click(screen.getByTestId('admin-gift-card-issue'));

    // then
    expect(await screen.findByTestId('admin-gift-card-amount-error')).toHaveTextContent('Amount must be between 1 and 1000');
    expect(adminGiftCards.create).not.toHaveBeenCalled();

    // when - valid
    await user.clear(screen.getByLabelText('Amount (USD)'));
    await user.type(screen.getByLabelText('Amount (USD)'), '10');
    await user.click(screen.getByTestId('admin-gift-card-issue'));

    // then
    await waitFor(() => expect(adminGiftCards.create).toHaveBeenCalledWith({ amount: 10, recipientUsername: null, note: null, expiresAt: null }));
    expect(await screen.findByTestId('admin-gift-card-issued')).toHaveTextContent('gift card:');
  });

  it('shows a backend error when issuing fails', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(adminGiftCards.create).mockRejectedValue(axiosFailure(400, { message: 'Unknown user nobody' }));
    renderWithQuery(<AdminGiftCards />);

    // when
    await user.type(screen.getByLabelText('Amount (USD)'), '10');
    await user.type(screen.getByLabelText('Recipient username (optional)'), 'nobody');
    await user.click(screen.getByTestId('admin-gift-card-issue'));

    // then
    expect(await screen.findByTestId('admin-gift-card-form-error')).toHaveTextContent('Unknown user nobody');
  });

  it('shows details with the ledger and disables an active card after confirmation', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(adminGiftCards.get).mockResolvedValueOnce(ok(card()) as never).mockResolvedValue(ok(card({ status: 'DISABLED' })) as never);
    vi.mocked(adminGiftCards.disable).mockResolvedValue(ok(card({ status: 'DISABLED' })) as never);
    renderWithQuery(<AdminGiftCards />);

    // when
    await user.click(await screen.findByRole('button', { name: 'Details of gift card GC-AAAA-BBBB' }));

    // then
    const drawer = await screen.findByRole('dialog', { name: 'Gift card GC-AAAA-BBBB' });
    expect(await within(drawer).findByTestId('admin-gift-card-details-balance')).toHaveTextContent('$30.00 of $50.00');
    expect(screen.getByTestId('admin-gift-card-ledger-0')).toHaveTextContent('ISSUED');
    expect(screen.getByTestId('admin-gift-card-ledger-0')).toHaveTextContent('admin');
    expect(screen.getByTestId('admin-gift-card-ledger-1')).toHaveTextContent('#12');

    // when
    await user.click(screen.getByTestId('admin-gift-card-disable'));
    await user.click(screen.getByTestId('admin-gift-card-disable-confirm-confirm'));

    // then
    await waitFor(() => expect(adminGiftCards.disable).toHaveBeenCalledWith('GC-AAAA-BBBB'));
    await waitFor(() => expect(screen.getByTestId('admin-gift-card-details-status')).toHaveTextContent('DISABLED'));
    expect(screen.queryByTestId('admin-gift-card-disable')).not.toBeInTheDocument();

    // when
    await user.click(screen.getByTestId('admin-gift-card-details-close'));

    // then
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('reports a failed disable and a failed detail load', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(adminGiftCards.get).mockResolvedValue(ok(card()) as never);
    vi.mocked(adminGiftCards.disable).mockRejectedValue(axiosFailure(409, { message: 'Already disabled' }));
    renderWithQuery(<AdminGiftCards />);

    // when
    await user.click(await screen.findByTestId('admin-gift-card-view-GC-AAAA-BBBB'));
    await user.click(await screen.findByTestId('admin-gift-card-disable'));
    await user.click(screen.getByTestId('admin-gift-card-disable-confirm-cancel'));
    await user.click(screen.getByTestId('admin-gift-card-disable'));
    await user.click(screen.getByTestId('admin-gift-card-disable-confirm-confirm'));

    // then
    expect(await screen.findByTestId('admin-gift-card-disable-error')).toHaveTextContent('Already disabled');
    expect(adminGiftCards.disable).toHaveBeenCalledTimes(1);
  });

  it('reports a detail that cannot be loaded', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(adminGiftCards.get).mockRejectedValue(new Error('gone'));
    renderWithQuery(<AdminGiftCards />);

    // when
    await user.click(await screen.findByTestId('admin-gift-card-view-GC-AAAA-BBBB'));

    // then
    expect(await screen.findByTestId('admin-gift-card-details-error')).toBeInTheDocument();
  });
});
