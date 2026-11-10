import type { CartWithCoupon } from '../../types/commerce';
import { useMoney } from '../../hooks/useMoney';
import { formatPoints } from '../../lib/payment';

/**
 * Gift card and loyalty point lines plus the amount left to pay by card. The cart summary
 * only carries `amountDue` while a gift card or points are applied, so nothing renders otherwise.
 */
export function CartTendersSummary({ cart, prefix }: { cart?: CartWithCoupon; prefix: 'cart' | 'checkout' }) {
  const { formatMoney } = useMoney();
  if (!cart || cart.amountDue == null) return null;
  const giftCard = cart.giftCardAmount ?? 0;
  const points = cart.pointsAmount ?? 0;
  return (
    <dl className="grid max-w-sm grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm" data-testid={`${prefix}-tenders-summary`}>
      {cart.giftCardCode && (
        <>
          <dt className="text-slate-500">Gift card {cart.giftCardCode}</dt>
          <dd className="text-right font-medium text-emerald-700" data-testid={`${prefix}-tenders-gift-card`}>−{formatMoney(giftCard)}</dd>
        </>
      )}
      {(cart.pointsRedeemed ?? 0) > 0 && (
        <>
          <dt className="text-slate-500">{formatPoints(cart.pointsRedeemed ?? 0)} points</dt>
          <dd className="text-right font-medium text-emerald-700" data-testid={`${prefix}-tenders-points`}>−{formatMoney(points)}</dd>
        </>
      )}
      <dt className="font-semibold text-slate-950">Amount due</dt>
      <dd className="text-right text-base font-bold text-slate-950" data-testid={`${prefix}-tenders-amount-due`}>{formatMoney(cart.amountDue)}</dd>
    </dl>
  );
}
