import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { LoyaltyPage } from './loyaltyPage';
import { renderWithRoute } from '../../test/renderWithRoute';
import { ok } from '../../test/paymentFixtures';

vi.mock('../../lib/api', () => ({
  loyalty: {
    account: vi.fn(() => Promise.resolve(ok({ balance: 300, tier: 'BRONZE', valueOfBalance: 3, lifetimeEarned: 300 }))),
    transactions: vi.fn(() => Promise.resolve(ok({ content: [], totalPages: 0 }))),
  },
  giftCards: { balance: vi.fn() },
}));

describe('LoyaltyPage', () => {
  it('shows the points, history and gift card sections and sets the title', async () => {
    // given / when
    renderWithRoute(<LoyaltyPage />);
    // then
    expect(screen.getByRole('heading', { level: 1, name: 'Loyalty and gift cards' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Your points' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Points history' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Gift card balance' })).toBeInTheDocument();
    expect(await screen.findByTestId('loyalty-balance')).toHaveTextContent('300 pts');
    expect(document.title).toContain('Loyalty and gift cards');
  });
});
