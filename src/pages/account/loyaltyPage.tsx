import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Surface } from '../../components/ui/surface';
import { PageHeader } from '../../components/commerce/shared';
import { LoyaltyAccountSummary } from '../../components/loyalty/LoyaltyAccountSummary';
import { LoyaltyTransactions } from '../../components/loyalty/LoyaltyTransactions';
import { GiftCardBalanceChecker } from '../../components/loyalty/GiftCardBalanceChecker';

export function LoyaltyPage() {
  useDocumentTitle('Loyalty and gift cards');
  return (
    <div className="space-y-6 pb-10" data-testid="loyalty-page">
      <Surface as="section" variant="hero" padding="xl">
        <PageHeader eyebrow="Account" title="Loyalty and gift cards" description="Earn points on paid orders and redeem them in your cart." />
      </Surface>
      <Surface as="section" variant="default" padding="lg" aria-labelledby="loyalty-account-heading" data-testid="loyalty-account-section">
        <h2 id="loyalty-account-heading" className="mb-4 text-lg font-semibold text-slate-950">Your points</h2>
        <LoyaltyAccountSummary />
      </Surface>
      <Surface as="section" variant="default" padding="lg" aria-labelledby="loyalty-history-heading" data-testid="loyalty-history-section">
        <h2 id="loyalty-history-heading" className="mb-4 text-lg font-semibold text-slate-950">Points history</h2>
        <LoyaltyTransactions />
      </Surface>
      <Surface as="section" variant="default" padding="lg" aria-labelledby="gift-card-heading" data-testid="gift-card-section">
        <h2 id="gift-card-heading" className="mb-4 text-lg font-semibold text-slate-950">Gift card balance</h2>
        <GiftCardBalanceChecker />
      </Surface>
    </div>
  );
}
