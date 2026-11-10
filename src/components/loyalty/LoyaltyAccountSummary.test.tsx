import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { LoyaltyAccountSummary } from './LoyaltyAccountSummary';
import { loyalty } from '../../lib/api';
import { renderWithRoute } from '../../test/renderWithRoute';
import { axiosError, ok } from '../../test/paymentFixtures';

vi.mock('../../lib/api', () => ({ loyalty: { account: vi.fn() } }));

describe('LoyaltyAccountSummary', () => {
  beforeEach(() => vi.resetAllMocks());

  it('shows balance, value, tier, lifetime points and the next tier', async () => {
    // given
    vi.mocked(loyalty.account).mockResolvedValue(ok({ balance: 1250, tier: 'SILVER', valueOfBalance: 12.5, lifetimeEarned: 1800 }));
    // when
    renderWithRoute(<LoyaltyAccountSummary />);
    // then
    expect(await screen.findByTestId('loyalty-balance')).toHaveTextContent('1,250 pts');
    expect(screen.getByTestId('loyalty-value')).toHaveTextContent('$12.50');
    expect(screen.getByTestId('loyalty-tier')).toHaveTextContent('SILVER');
    expect(screen.getByTestId('loyalty-lifetime')).toHaveTextContent('1,800 pts');
    expect(screen.getByTestId('loyalty-next-tier')).toHaveTextContent('3,200 more lifetime points to reach Gold');
  });

  it('defaults a new account to bronze and celebrates gold', async () => {
    // given
    vi.mocked(loyalty.account).mockResolvedValueOnce(ok({}));
    const { unmount } = renderWithRoute(<LoyaltyAccountSummary />);
    // then
    expect(await screen.findByTestId('loyalty-tier')).toHaveTextContent('BRONZE');
    expect(screen.getByTestId('loyalty-next-tier')).toHaveTextContent('1,000 more lifetime points to reach Silver');
    unmount();
    // given
    vi.mocked(loyalty.account).mockResolvedValueOnce(ok({ balance: 9000, tier: 'GOLD', valueOfBalance: 90, lifetimeEarned: 9000 }));
    // when
    renderWithRoute(<LoyaltyAccountSummary />);
    // then
    expect(await screen.findByTestId('loyalty-next-tier')).toHaveTextContent('top tier');
  });

  it('reports a failed load', async () => {
    // given
    vi.mocked(loyalty.account).mockRejectedValue(axiosError(500));
    // when
    renderWithRoute(<LoyaltyAccountSummary />);
    // then
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  });
});
