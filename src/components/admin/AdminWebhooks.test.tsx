import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { adminWebhooks } from '../../lib/api';
import { AdminWebhooks } from './AdminWebhooks';
import { ok, page, subscriptionFixture } from '../../test/webhookFixtures';
import { renderWithQuery } from '../../test/queryWrapper';

vi.mock('../../lib/api', () => ({
  adminWebhooks: { list: vi.fn() },
}));

describe('AdminWebhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists every user's subscriptions with their state", async () => {
    // given
    vi.mocked(adminWebhooks.list).mockResolvedValue(ok(page([
      subscriptionFixture(),
      subscriptionFixture({ id: 8, username: 'bob', active: false, disabledReason: '20 consecutive failures', description: null }),
    ])) as never);

    // when
    renderWithQuery(<AdminWebhooks />);

    // then
    expect(await screen.findByTestId('admin-webhook-username-7')).toHaveTextContent('alice');
    expect(screen.getByTestId('admin-webhook-active-7')).toHaveTextContent('Active');
    expect(screen.getByTestId('admin-webhook-row-7')).toHaveTextContent('order.created');
    expect(screen.getByTestId('admin-webhook-active-8')).toHaveTextContent('Disabled');
    expect(screen.getByTestId('admin-webhook-row-8')).toHaveTextContent('20 consecutive failures');
  });

  it('filters by username, pages, and clears the filter', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(adminWebhooks.list).mockResolvedValue(ok(page([subscriptionFixture()], 2)) as never);
    renderWithQuery(<AdminWebhooks />);
    await screen.findByTestId('admin-webhook-row-7');

    // when
    await user.type(screen.getByRole('textbox', { name: 'Username' }), ' alice ');
    await user.click(screen.getByRole('button', { name: 'Filter' }));

    // then
    await waitFor(() => expect(adminWebhooks.list).toHaveBeenLastCalledWith('alice', 0, 20));

    // when
    await user.click(screen.getByTestId('admin-webhooks-next-page'));

    // then
    await waitFor(() => expect(adminWebhooks.list).toHaveBeenLastCalledWith('alice', 1, 20));

    // when
    await user.click(screen.getByTestId('admin-webhooks-clear'));

    // then
    await waitFor(() => expect(adminWebhooks.list).toHaveBeenLastCalledWith(undefined, 0, 20));
    expect(screen.getByTestId('admin-webhooks-username')).toHaveValue('');
    expect(screen.queryByTestId('admin-webhooks-clear')).not.toBeInTheDocument();
  });

  it('shows empty and error states', async () => {
    // given
    vi.mocked(adminWebhooks.list).mockResolvedValueOnce(ok(page([], 0)) as never);
    const { unmount } = renderWithQuery(<AdminWebhooks />);

    // then
    expect(await screen.findByTestId('admin-webhooks-empty')).toBeInTheDocument();
    unmount();

    // given
    vi.mocked(adminWebhooks.list).mockRejectedValueOnce(new Error('down'));
    renderWithQuery(<AdminWebhooks />);

    // then
    expect(await screen.findByTestId('admin-webhooks-error')).toBeInTheDocument();
  });
});
