import { useMoney } from '../../hooks/useMoney';
import { formatPercent } from '../../lib/money';
import type { Order } from '../../types/order';

/** VAT contained in the order total. Orders from backends before 3.15.0 carry no breakdown and render nothing. */
export function OrderVat({ order }: { order: Pick<Order, 'totalAmount' | 'netAmount' | 'taxAmount' | 'taxRate' | 'taxCountry'> }) {
  const { formatMoney } = useMoney();
  if (order.taxRate == null || order.taxAmount == null) return null;
  const net = order.netAmount ?? order.totalAmount - order.taxAmount;

  return (
    <p className="mt-2 text-right text-sm text-slate-600" data-testid="order-details-vat">
      Includes VAT {formatPercent(order.taxRate)}
      {order.taxCountry ? <> (<span data-testid="order-details-vat-country">{order.taxCountry}</span>)</> : null}
      {': '}
      <span data-testid="order-details-vat-amount">{formatMoney(order.taxAmount)}</span>
      {', net: '}
      <span data-testid="order-details-vat-net">{formatMoney(net)}</span>
    </p>
  );
}
