import { useQuery } from '@tanstack/react-query';
import { loyalty } from '../../lib/api';
import { LOYALTY_ACCOUNT_QUERY_KEY } from '../../lib/tenderQueryKeys';
import { formatPrice } from '../../lib/format';
import { formatPoints } from '../../lib/payment';
import { Badge } from '../ui/badge';
import type { LoyaltyTier } from '../../types/commerce';

const TIER_VARIANT: Record<LoyaltyTier, 'default' | 'outline' | 'warning'> = { BRONZE: 'default', SILVER: 'outline', GOLD: 'warning' };

const NEXT_TIER: Record<LoyaltyTier, { name: string; at: number } | null> = {
  BRONZE: { name: 'Silver', at: 1000 },
  SILVER: { name: 'Gold', at: 5000 },
  GOLD: null,
};

/** Balance, tier, value at checkout and lifetime points of the signed-in customer. */
export function LoyaltyAccountSummary() {
  const account = useQuery({ queryKey: LOYALTY_ACCOUNT_QUERY_KEY, queryFn: loyalty.account, retry: false });

  if (account.isLoading) return <p className="text-sm text-slate-500" data-testid="loyalty-account-loading">Loading your points…</p>;
  if (account.isError || !account.data) {
    return <p className="text-sm text-red-700" role="alert" data-testid="loyalty-account-error">Your loyalty account could not be loaded.</p>;
  }
  const { balance = 0, tier = 'BRONZE', valueOfBalance = 0, lifetimeEarned = 0 } = account.data.data;
  const next = NEXT_TIER[tier];

  return (
    <div data-testid="loyalty-account">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/80 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Balance</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-950" data-testid="loyalty-balance">{formatPoints(balance)} pts</dd>
        </div>
        <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/80 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Worth at checkout</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-950" data-testid="loyalty-value">{formatPrice(valueOfBalance)}</dd>
        </div>
        <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/80 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tier</dt>
          <dd className="mt-2"><Badge variant={TIER_VARIANT[tier]} tone="tracking" data-testid="loyalty-tier">{tier}</Badge></dd>
        </div>
        <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/80 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lifetime earned</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-950" data-testid="loyalty-lifetime">{formatPoints(lifetimeEarned)} pts</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-slate-600" data-testid="loyalty-next-tier">
        {next
          ? `${formatPoints(Math.max(next.at - lifetimeEarned, 0))} more lifetime points to reach ${next.name}. 100 points = $1.00 at checkout.`
          : 'You are at the top tier. 100 points = $1.00 at checkout.'}
      </p>
    </div>
  );
}
