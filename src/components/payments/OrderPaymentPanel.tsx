import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { auth, payments } from '../../lib/api';
import { describeCard, describePaymentFailure, formatMoney, orderAmountDue } from '../../lib/payment';
import { isPaymentEnabled } from '../../lib/runtimeConfig';
import { Surface } from '../ui/surface';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import type { Order } from '../../types/order';
import type { Payment } from '../../types/payment';

function PaymentFacts({ payment }: { payment: Payment }) {
  const failed = payment.status === 'FAILED' || payment.status === 'VOIDED';
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm" data-testid="order-payment-latest">
      <dt className="text-slate-500">Status</dt>
      <dd><PaymentStatusBadge status={payment.status} testId="order-payment-status" /></dd>
      <dt className="text-slate-500">Card</dt>
      <dd className="text-slate-900" data-testid="order-payment-card">{describeCard(payment)}</dd>
      <dt className="text-slate-500">Amount</dt>
      <dd className="text-slate-900" data-testid="order-payment-amount">{formatMoney(payment.amount, payment.currency)}</dd>
      {failed && (
        <>
          <dt className="text-slate-500">Reason</dt>
          <dd className="text-red-700" data-testid="order-payment-failure">{describePaymentFailure(payment.failureCode, payment.failureMessage)}</dd>
        </>
      )}
      {payment.refundedAmount > 0 && (
        <>
          <dt className="text-slate-500">Refunded</dt>
          <dd className="text-slate-900" data-testid="order-payment-refunded">{formatMoney(payment.refundedAmount, payment.currency)}</dd>
        </>
      )}
    </dl>
  );
}

/** Card payments for an order (newest first) and a "Pay now" entry point while it is PENDING. */
export function OrderPaymentPanel({ order }: { order: Order }) {
  const paymentsQuery = useQuery({
    queryKey: ['payments', order.id],
    queryFn: () => payments.forOrder(order.id),
    retry: false,
  });
  // The signed-in user is already cached by the route guard; no need to refetch it here.
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => auth.me(), staleTime: 60_000 });
  const list = paymentsQuery.data?.data ?? [];
  const latest = list[0];
  const ownsOrder = me?.data?.username === order.username;
  const amountDue = orderAmountDue(order);
  const canPay = order.status === 'PENDING' && ownsOrder && amountDue > 0;

  return (
    <Surface variant="inset" padding="md" className="mb-6" data-testid="order-payment-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-950" data-testid="order-payment-title">Payment</h2>
        {canPay && (
          <Link
            to={`/orders/${order.id}/pay`}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
            data-testid="order-payment-pay-now"
          >
            Pay now
          </Link>
        )}
      </div>
      {order.status === 'PENDING' && (
        <p className="mb-3 text-sm text-amber-800" data-testid="order-payment-awaiting">Awaiting payment of {formatMoney(amountDue)}.</p>
      )}
      {paymentsQuery.isLoading && <p className="text-sm text-slate-500" data-testid="order-payment-loading">Loading payments…</p>}
      {paymentsQuery.isError && <p className="text-sm text-slate-500" data-testid="order-payment-unavailable">Payment details are unavailable right now.</p>}
      {paymentsQuery.isSuccess && !latest && <p className="text-sm text-slate-500" data-testid="order-payment-none">No card payments yet.</p>}
      {latest && <PaymentFacts payment={latest} />}
      {list.length > 1 && (
        <div className="mt-4 border-t border-stone-200 pt-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">All attempts</h3>
          <ul className="space-y-2 text-sm" data-testid="order-payment-attempts">
            {list.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2" data-testid={`order-payment-attempt-${payment.id}`}>
                <span className="text-slate-700">{new Date(payment.createdAt).toLocaleString()} · {describeCard(payment)}</span>
                <span className="flex items-center gap-2">
                  <span className="text-slate-900">{formatMoney(payment.amount, payment.currency)}</span>
                  <PaymentStatusBadge status={payment.status} testId={`order-payment-attempt-status-${payment.id}`} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Surface>
  );
}

/** Mount point for order details; renders nothing when a build disables payment-service. */
export function OrderPaymentSection({ order }: { order: Order }) {
  return isPaymentEnabled() ? <OrderPaymentPanel order={order} /> : null;
}
