import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { formatDateTime, selectClassName } from '../../lib/commerceFormat';
import { useWebhookDeliveries, useWebhookMutations } from '../../hooks/useWebhooks';
import type { WebhookDelivery, WebhookDeliveryStatus } from '../../types/commerce';
import { DeliveryStatusBadge } from './webhookStatus';
import { DELIVERY_STATUSES } from '../../lib/webhookFormat';
import { WebhookDeliveryDrawer } from './WebhookDeliveryDrawer';

interface WebhookDeliveriesProps {
  subscriptionId: number;
  active: boolean;
}

export function WebhookDeliveries({ subscriptionId, active }: WebhookDeliveriesProps) {
  const [status, setStatus] = useState<WebhookDeliveryStatus | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<WebhookDelivery | null>(null);
  const deliveries = useWebhookDeliveries(subscriptionId, status, page);
  const { redeliver } = useWebhookMutations();
  const prefix = `webhook-deliveries-${subscriptionId}`;
  const items = deliveries.data?.content ?? [];
  const totalPages = deliveries.data?.totalPages ?? 0;

  return (
    <section className="space-y-3" aria-label="Deliveries" data-testid={prefix}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-48">
          <Label htmlFor={`${prefix}-status`}>Delivery status</Label>
          <select
            id={`${prefix}-status`}
            value={status ?? ''}
            onChange={(event) => { setStatus((event.target.value || undefined) as WebhookDeliveryStatus | undefined); setPage(0); }}
            className={`mt-1 ${selectClassName}`}
            data-testid={`${prefix}-status`}
          >
            <option value="">All statuses</option>
            {DELIVERY_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => deliveries.refetch()} disabled={deliveries.isFetching} data-testid={`${prefix}-refresh`}>
          {deliveries.isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {deliveries.isLoading && <p className="text-sm text-slate-500" data-testid={`${prefix}-loading`}>Loading deliveries…</p>}
      {deliveries.isError && <p className="text-sm text-red-700" role="alert" data-testid={`${prefix}-error`}>Unable to load deliveries.</p>}
      {!deliveries.isLoading && !deliveries.isError && items.length === 0 && (
        <p className="text-sm text-slate-500" data-testid={`${prefix}-empty`}>No deliveries yet. Send a test to see one.</p>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Deliveries of this webhook, newest first</caption>
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2">Created</th>
                <th scope="col" className="px-3 py-2">Event</th>
                <th scope="col" className="px-3 py-2">Status</th>
                <th scope="col" className="px-3 py-2">Code</th>
                <th scope="col" className="px-3 py-2">Attempts</th>
                <th scope="col" className="px-3 py-2 text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((delivery) => (
                <tr key={delivery.id} className="border-b border-stone-100" data-testid={`webhook-delivery-${delivery.id}`}>
                  <td className="px-3 py-2 text-slate-600">{formatDateTime(delivery.createdAt)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-900">{delivery.eventType}</td>
                  <td className="px-3 py-2"><DeliveryStatusBadge status={delivery.status} testId={`webhook-delivery-status-${delivery.id}`} /></td>
                  <td className="px-3 py-2 text-slate-700" data-testid={`webhook-delivery-code-${delivery.id}`}>{delivery.lastStatusCode ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-700">{delivery.attempts ?? 0}</td>
                  <td className="px-3 py-2 text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelected(delivery)} aria-label={`Details of delivery ${delivery.id}`} data-testid={`webhook-delivery-details-${delivery.id}`}>Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500" data-testid={`${prefix}-page`}>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} data-testid={`${prefix}-previous`}>Previous</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages - 1} data-testid={`${prefix}-next`}>Next</Button>
          </div>
        </div>
      )}

      <WebhookDeliveryDrawer
        delivery={selected}
        onClose={() => setSelected(null)}
        canRedeliver={active}
        onRedeliver={(delivery) => redeliver.mutateAsync({ id: subscriptionId, deliveryId: delivery.id as string })}
      />
    </section>
  );
}
