import type { Order } from '../../types/order';
import { useMoney } from '../../hooks/useMoney';
import { formatPoints, orderAmountDue } from '../../lib/payment';

export function OrderAmountSummary({ order }: { order: Order }) {
  const { formatMoney } = useMoney();
  const hasTax = order.taxAmount != null && order.taxAmount > 0;
  const giftCard = order.giftCardAmount ?? 0;
  const points = order.pointsAmount ?? 0;
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm" data-testid="payment-order-summary">
      <dt className="text-slate-600">Order #{order.id} total</dt>
      <dd className="text-right font-medium text-slate-950" data-testid="payment-order-total">{formatMoney(order.totalAmount)}</dd>
      {hasTax && (
        <>
          <dt className="text-slate-500" data-testid="payment-order-vat-label">
            incl. VAT{order.taxRate != null ? ` ${order.taxRate}%` : ''}{order.taxCountry ? ` (${order.taxCountry})` : ''}
          </dt>
          <dd className="text-right text-slate-500" data-testid="payment-order-vat">{formatMoney(order.taxAmount ?? 0)}</dd>
        </>
      )}
      {giftCard > 0 && (
        <>
          <dt className="text-slate-600">Gift card {order.giftCardCode}</dt>
          <dd className="text-right text-emerald-700" data-testid="payment-order-gift-card">−{formatMoney(giftCard)}</dd>
        </>
      )}
      {points > 0 && (
        <>
          <dt className="text-slate-600">{formatPoints(order.pointsRedeemed ?? 0)} loyalty points</dt>
          <dd className="text-right text-emerald-700" data-testid="payment-order-points">−{formatMoney(points)}</dd>
        </>
      )}
      <dt className="border-t border-stone-200 pt-2 font-semibold text-slate-950">Amount due</dt>
      <dd className="border-t border-stone-200 pt-2 text-right text-lg font-bold text-slate-950" data-testid="payment-order-amount-due">{formatMoney(orderAmountDue(order))}</dd>
    </dl>
  );
}
