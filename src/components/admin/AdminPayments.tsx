import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminPayments } from '../../lib/api';
import { formatDateTime, selectClassName } from '../../lib/commerceFormat';
import type { Payment, PaymentStatus } from '../../types/payment';
import { PageHeader } from '../commerce/shared';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';
import { AdminPager } from './AdminPager';
import { AdminSectionNav } from './AdminSectionNav';

const STATUSES: PaymentStatus[] = ['REQUIRES_ACTION', 'PROCESSING', 'CAPTURED', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'VOIDED'];
const PAGE_SIZE = 20;

const variantByStatus: Partial<Record<PaymentStatus, 'success' | 'warning' | 'error' | 'default'>> = {
  CAPTURED: 'success',
  REQUIRES_ACTION: 'warning',
  PROCESSING: 'warning',
  FAILED: 'error',
  VOIDED: 'error',
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function PaymentRow({ payment }: { payment: Payment }) {
  return (
    <tr className="border-b border-stone-100" data-testid={`admin-payment-row-${payment.id}`}>
      <td className="px-4 py-3"><span className="font-mono text-xs text-slate-700" title={payment.id}>{payment.id.slice(0, 8)}</span><span className="block text-xs text-slate-500">{formatDateTime(payment.createdAt)}</span></td>
      <td className="px-4 py-3">#{payment.orderId}</td>
      <td className="px-4 py-3 font-semibold text-slate-900" data-testid={`admin-payment-amount-${payment.id}`}>
        {formatMoney(payment.amount, payment.currency)}
        {payment.refundedAmount > 0 && <span className="block text-xs font-normal text-slate-500">refunded {formatMoney(payment.refundedAmount, payment.currency)}</span>}
      </td>
      <td className="px-4 py-3 text-slate-700">{payment.cardBrand} •••• {payment.cardLast4}</td>
      <td className="px-4 py-3">
        <Badge variant={variantByStatus[payment.status] ?? 'default'} data-testid={`admin-payment-status-${payment.id}`}>{payment.status.replace(/_/g, ' ')}</Badge>
        {payment.failureMessage && <span className="block text-xs text-red-700">{payment.failureCode ? `${payment.failureCode}: ` : ''}{payment.failureMessage}</span>}
      </td>
    </tr>
  );
}

export function AdminPayments() {
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [page, setPage] = useState(0);
  const list = useQuery({
    queryKey: ['admin-payments', status, page],
    queryFn: async () => (await adminPayments.list(status || undefined, page, PAGE_SIZE)).data,
    placeholderData: keepPreviousData,
  });
  const items = list.data?.content ?? [];

  return (
    <div className="space-y-6 pb-10" data-testid="admin-payments">
      <AdminSectionNav />
      <PageHeader eyebrow="Payments" title="Card payments" description="Every card payment recorded by payment-service, newest first." />
      <Surface variant="default" padding="none" className="overflow-hidden">
        <div className="flex items-end gap-3 border-b border-stone-200 p-4">
          <div className="w-64">
            <Label htmlFor="admin-payments-status">Status</Label>
            <select id="admin-payments-status" value={status} onChange={(event) => { setStatus(event.target.value as PaymentStatus | ''); setPage(0); }} className={`mt-1 ${selectClassName}`} data-testid="admin-payments-status">
              <option value="">All statuses</option>
              {STATUSES.map((value) => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
        {list.isLoading && <p className="p-6 text-sm text-slate-500" data-testid="admin-payments-loading">Loading payments…</p>}
        {list.isError && <p className="p-6 text-sm text-red-700" role="alert" data-testid="admin-payments-error">Unable to load payments.</p>}
        {!list.isLoading && !list.isError && items.length === 0 && <p className="p-6 text-sm text-slate-500" data-testid="admin-payments-empty">No payments match this filter.</p>}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr><th scope="col" className="px-4 py-3">Payment</th><th scope="col" className="px-4 py-3">Order</th><th scope="col" className="px-4 py-3">Amount</th><th scope="col" className="px-4 py-3">Card</th><th scope="col" className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>{items.map((payment) => <PaymentRow key={payment.id} payment={payment} />)}</tbody>
            </table>
          </div>
        )}
        <AdminPager page={page} totalPages={list.data?.totalPages ?? 0} onPageChange={setPage} testIdPrefix="admin-payments" />
      </Surface>
    </div>
  );
}
