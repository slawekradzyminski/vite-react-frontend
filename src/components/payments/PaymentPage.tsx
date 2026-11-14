import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { orders, payments } from '../../lib/api';
import { describeCard, describePaymentFailure, formatMoney, orderAmountDue } from '../../lib/payment';
import { usePaymentFlow, type PaymentFlowOptions } from '../../hooks/usePaymentFlow';
import { Surface } from '../ui/surface';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { CardPaymentForm } from './CardPaymentForm';
import { OrderAmountSummary } from './OrderAmountSummary';
import { ThreeDsDialog } from './ThreeDsDialog';
import type { Order } from '../../types/order';
import { parseRouteId } from '../../lib/routeIds';
import { ReservationCountdown } from '../orders/ReservationCountdown';
import { reservationExpired } from '../../lib/reservation';

const LINK_CLASS = 'inline-flex w-fit rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800';

function OrderLink({ order, testId, label = 'View order' }: { order: Pick<Order, 'id'>; testId: string; label?: string }) {
  return <Link to={`/orders/${order.id}`} className={LINK_CLASS} data-testid={testId}>{label}</Link>;
}

interface PaymentPageProps {
  flowOptions?: PaymentFlowOptions;
  now?: () => Date;
}

/** Card payment for a PENDING order: `/orders/:id/pay`. */
export function PaymentPage({ flowOptions, now }: PaymentPageProps = {}) {
  const { id } = useParams<{ id: string }>();
  const parsedId = parseRouteId(id);
  const orderId = parsedId ?? 0;
  const validId = parsedId !== null;
  const orderQuery = useQuery({ queryKey: ['order', orderId], queryFn: () => orders.getOrderById(orderId), enabled: validId });
  const paymentsQuery = useQuery({ queryKey: ['payments', orderId], queryFn: () => payments.forOrder(orderId), enabled: validId, retry: false });
  const flow = usePaymentFlow(orderId, flowOptions);
  const [challengeDismissed, setChallengeDismissed] = useState(false);
  const order = orderQuery.data?.data;
  const { state } = flow;
  const { refetch: refetchOrder } = orderQuery;

  // payment-service refuses an order whose reservation ran out (409); reload it so the page shows why.
  useEffect(() => {
    if (state.step === 'notPayable') void refetchOrder();
  }, [state.step, refetchOrder]);

  if (orderQuery.isLoading) {
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="payment-loading">Loading order…</Surface>;
  }
  if (!order) {
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="payment-order-not-found">Order not found</Surface>;
  }

  const amountDue = orderAmountDue(order);
  const inProgress = paymentsQuery.data?.data?.find((payment) => payment.status === 'REQUIRES_ACTION' || payment.status === 'PROCESSING');

  const renderBody = () => {
    switch (state.step) {
      case 'captured':
        return (
          <div className="space-y-4" role="status" data-testid="payment-success">
            <h2 className="text-xl font-semibold text-emerald-800">Payment received</h2>
            <p className="text-sm text-slate-600" data-testid="payment-success-details">
              {formatMoney(state.payment.amount, state.payment.currency)} was charged to {describeCard(state.payment)}. Your order will show as paid in a moment.
            </p>
            <OrderLink order={order} testId="payment-success-order-link" />
          </div>
        );
      case 'failed':
        return (
          <div className="space-y-4" data-testid="payment-failed">
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert" data-testid="payment-failed-message">
              {describePaymentFailure(state.payment.failureCode, state.payment.failureMessage)}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => { setChallengeDismissed(false); flow.reset(); }} data-testid="payment-try-another-card">Try another card</Button>
              <OrderLink order={order} testId="payment-failed-order-link" label="Back to order" />
            </div>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-3 text-slate-700" role="status" aria-live="polite" data-testid="payment-processing">
            <Spinner size="sm" data-testid="payment-processing-spinner" />
            <span>Processing… the card provider is confirming {describeCard(state.payment)}.</span>
          </div>
        );
      case 'timeout':
        return (
          <div className="space-y-4" data-testid="payment-timeout">
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status" data-testid="payment-timeout-message">
              The payment is still processing. We stopped checking after a minute; the order page shows the result once it arrives.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={flow.checkAgain} data-testid="payment-check-again">Check again</Button>
              <OrderLink order={order} testId="payment-timeout-order-link" />
            </div>
          </div>
        );
      case 'notPayable':
        return (
          <div className="space-y-4" data-testid="payment-not-payable">
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert" data-testid="payment-not-payable-message">
              This order cannot be paid: {state.message}
            </p>
            <OrderLink order={order} testId="payment-not-payable-order-link" />
          </div>
        );
      case 'challenge':
        return (
          <div className="space-y-4" data-testid="payment-challenge">
            <p className="text-sm text-slate-700">Your bank needs to verify this payment with 3-D Secure.</p>
            {challengeDismissed && <Button onClick={() => setChallengeDismissed(false)} data-testid="payment-3ds-reopen">Complete verification</Button>}
          </div>
        );
      default:
        return (
          <>
            {inProgress && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-testid="payment-in-progress">
                <span>A payment with {describeCard(inProgress)} is still {inProgress.status === 'PROCESSING' ? 'processing' : 'waiting for 3-D Secure'}.</span>
                <Button size="sm" variant="outline" onClick={() => { setChallengeDismissed(false); flow.resume(inProgress); }} data-testid="payment-resume">Continue this payment</Button>
              </div>
            )}
            <CardPaymentForm
              amountDue={amountDue}
              submitting={state.step === 'submitting'}
              error={state.step === 'form' ? state.error : undefined}
              onSubmit={flow.pay}
              now={now}
            />
          </>
        );
    }
  };

  const renderUnpayable = () => {
    if (order.status === 'CANCELLED') {
      return <p className="text-sm text-slate-700" data-testid="payment-order-cancelled">This order was cancelled, so there is nothing to pay.</p>;
    }
    if (amountDue <= 0) {
      return <p className="text-sm font-medium text-emerald-800" data-testid="payment-paid-by-tenders">Paid with gift card / points. Nothing is left to pay by card.</p>;
    }
    return <p className="text-sm text-slate-700" data-testid="payment-already-paid">This order is already paid.</p>;
  };

  // Once a payment is under way its outcome wins over the order's (possibly refreshed) status.
  const payable = order.status === 'PENDING' && amountDue > 0;
  const showFlow = payable || state.step !== 'form';

  return (
    <div className="space-y-6 pb-10" data-testid="payment-page">
      <Surface as="section" variant="hero" padding="xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Payment</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950" data-testid="payment-title">Pay for order #{order.id}</h1>
      </Surface>
      {/* A payment under way keeps its own outcome; the countdown only matters while the card form is open. */}
      {(state.step === 'form' || reservationExpired(order)) && (
        <ReservationCountdown order={order} onDeadline={() => { void refetchOrder(); }} />
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Surface as="section" variant="default" padding="lg" aria-labelledby="payment-card-heading" data-testid="payment-card-section">
          <h2 id="payment-card-heading" className="mb-4 text-lg font-semibold text-slate-950">Card details</h2>
          {showFlow ? renderBody() : (
            <div className="space-y-4" data-testid="payment-not-required">
              {renderUnpayable()}
              <OrderLink order={order} testId="payment-not-required-order-link" />
            </div>
          )}
        </Surface>
        <Surface as="aside" variant="default" padding="lg" aria-labelledby="payment-summary-heading" data-testid="payment-summary-section">
          <h2 id="payment-summary-heading" className="mb-4 text-lg font-semibold text-slate-950">Summary</h2>
          <OrderAmountSummary order={order} />
        </Surface>
      </div>
      <ThreeDsDialog
        key={state.step === 'challenge' ? state.payment.id : 'none'}
        open={state.step === 'challenge' && !challengeDismissed}
        confirming={state.step === 'challenge' && !!state.confirming}
        error={state.step === 'challenge' ? state.error : undefined}
        onConfirm={flow.confirmThreeDs}
        onCancel={() => setChallengeDismissed(true)}
      />
    </div>
  );
}
