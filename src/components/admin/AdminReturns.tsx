import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminReturns } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { serverMessage } from '../../lib/requestErrors';
import type { ItemCondition, ReturnRequest, ReturnStatus } from '../../types/commerce';
import { formatDateTime, selectClassName } from '../../lib/commerceFormat';
import { PageHeader, StatusBadge } from '../commerce/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';
import { AdminSectionNav } from './AdminSectionNav';

function ReturnActions({ item, onDone }: { item: ReturnRequest; onDone: () => void }) {
  const id = item.id as number;
  const [note, setNote] = useState('');
  const [conditions, setConditions] = useState<Record<number, ItemCondition>>(
    () => Object.fromEntries((item.items ?? []).map((line) => [line.productId as number, 'RESELLABLE' as ItemCondition])),
  );
  const [error, setError] = useState<string | null>(null);
  const run = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: () => { setError(null); onDone(); },
    onError: (mutationError) => setError(serverMessage(mutationError, 'This action failed.')),
  });

  return (
    <div className="space-y-2" data-testid={`admin-return-actions-${id}`}>
      {item.status === 'REQUESTED' && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => run.mutate(() => adminReturns.approve(id))} disabled={run.isPending} data-testid={`admin-return-approve-${id}`}>Approve</Button>
          <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Rejection reason" maxLength={500} className="max-w-xs" aria-label="Rejection reason" data-testid={`admin-return-note-${id}`} />
          <Button size="sm" variant="outline" onClick={() => run.mutate(() => adminReturns.reject(id, note))} disabled={run.isPending || !note.trim()} data-testid={`admin-return-reject-${id}`}>Reject</Button>
        </div>
      )}
      {item.status === 'APPROVED' && (
        <div className="space-y-2">
          {(item.items ?? []).map((line) => (
            <div key={line.productId} className="flex flex-wrap items-center gap-2 text-sm" data-testid={`admin-return-condition-row-${id}-${line.productId}`}>
              <Label htmlFor={`admin-return-condition-${id}-${line.productId}`} className="min-w-48">{line.quantity} × {line.productName}</Label>
              <select
                id={`admin-return-condition-${id}-${line.productId}`}
                value={conditions[line.productId as number]}
                onChange={(event) => setConditions({ ...conditions, [line.productId as number]: event.target.value as ItemCondition })}
                className={`w-44 ${selectClassName}`}
                data-testid={`admin-return-condition-${id}-${line.productId}`}
              >
                <option value="RESELLABLE">Resellable (restock)</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </div>
          ))}
          <Button size="sm" onClick={() => run.mutate(() => adminReturns.receive(id, Object.entries(conditions).map(([productId, condition]) => ({ productId: Number(productId), condition }))))} disabled={run.isPending} data-testid={`admin-return-receive-${id}`}>Record receipt</Button>
        </div>
      )}
      {item.status === 'RECEIVED' && (
        <Button size="sm" onClick={() => run.mutate(() => adminReturns.refund(id))} disabled={run.isPending} data-testid={`admin-return-refund-${id}`}>Refund {formatPrice(item.estimatedRefund ?? 0)}</Button>
      )}
      {error && <p className="text-sm text-red-700" role="alert" data-testid={`admin-return-error-${id}`}>{error}</p>}
    </div>
  );
}

export function AdminReturns() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ReturnStatus | ''>('');
  const list = useQuery({ queryKey: ['admin-returns', status], queryFn: () => adminReturns.list(status || undefined) });
  const items = list.data?.data.content ?? [];
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  return (
    <div className="space-y-6 pb-10" data-testid="admin-returns">
      <AdminSectionNav />
      <PageHeader
        eyebrow="After sales"
        title="Returns"
        description="Approve or reject requests, inspect received goods and refund. Resellable items go back to stock."
        aside={
          <div className="w-48">
            <Label htmlFor="admin-returns-filter" className="sr-only">Status</Label>
            <select id="admin-returns-filter" value={status} onChange={(event) => setStatus(event.target.value as ReturnStatus | '')} className={selectClassName} data-testid="admin-returns-filter">
              {['', 'REQUESTED', 'APPROVED', 'RECEIVED', 'REFUNDED', 'REJECTED'].map((value) => <option key={value || 'ALL'} value={value}>{value || 'All'}</option>)}
            </select>
          </div>
        }
      />
      <Surface variant="default" padding="none" className="overflow-hidden">
        {list.isError && <p className="p-6 text-sm text-red-700" role="alert" data-testid="admin-returns-error">Unable to load returns.</p>}
        {!list.isLoading && items.length === 0 && <p className="p-6 text-sm text-slate-500" data-testid="admin-returns-empty">No returns in this status.</p>}
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <li key={item.id} className="space-y-3 p-5" data-testid={`admin-return-${item.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-medium text-slate-950">Return #{item.id}</span>
                  <Link to={`/orders/${item.orderId}`} className="ml-2 text-sky-700 hover:underline" data-testid={`admin-return-order-${item.id}`}>order #{item.orderId}</Link>
                  <span className="ml-2 text-slate-500">{item.username} · {item.reason?.replace(/_/g, ' ').toLowerCase()} · {formatDateTime(item.createdAt)}</span>
                </div>
                <StatusBadge status={item.status} testId={`admin-return-status-${item.id}`} />
              </div>
              {item.comment && <p className="text-sm text-slate-600">“{item.comment}”</p>}
              <p className="text-sm text-slate-600" data-testid={`admin-return-amount-${item.id}`}>
                {(item.items ?? []).map((line) => `${line.quantity} × ${line.productName}${line.condition ? ` (${line.condition.toLowerCase()})` : ''}`).join(', ')}
                {' · '}
                {item.refundAmount != null ? `refunded ${formatPrice(item.refundAmount)}` : `refund ${formatPrice(item.estimatedRefund ?? 0)}`}
              </p>
              <ReturnActions key={`${item.id}-${item.status}`} item={item} onDone={refresh} />
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
