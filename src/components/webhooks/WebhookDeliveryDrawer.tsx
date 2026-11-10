import { useState, type ReactNode } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { formatDateTime } from '../../lib/commerceFormat';
import { deliveryHeaders, prettyJson } from '../../lib/webhookFormat';
import { serverMessage } from '../../lib/requestErrors';
import type { WebhookDelivery } from '../../types/commerce';
import { DeliveryStatusBadge } from './webhookStatus';

interface WebhookDeliveryDrawerProps {
  delivery: WebhookDelivery | null;
  onClose: () => void;
  onRedeliver: (delivery: WebhookDelivery) => Promise<WebhookDelivery>;
  canRedeliver: boolean;
}

function Detail({ label, value, testId }: { label: string; value: ReactNode; testId: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900" data-testid={testId}>{value}</dd>
    </div>
  );
}

export function WebhookDeliveryDrawer({ delivery, onClose, onRedeliver, canRedeliver }: WebhookDeliveryDrawerProps) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  const close = () => { setResult(null); onClose(); };
  const redeliver = async () => {
    if (!delivery) return;
    setPending(true);
    setResult(null);
    try {
      const created = await onRedeliver(delivery);
      setResult({ ok: true, message: `Redelivered as ${created.id}: ${created.status}${created.lastStatusCode ? ` (HTTP ${created.lastStatusCode})` : ''}.` });
    } catch (error) {
      setResult({ ok: false, message: serverMessage(error, 'Unable to redeliver this event.') });
    } finally {
      setPending(false);
    }
  };

  const headers: Record<string, string> = delivery ? deliveryHeaders(delivery) : {};

  return (
    <Modal
      open={delivery !== null}
      onClose={close}
      placement="drawer"
      title="Delivery details"
      description={delivery ? `${delivery.eventType} · ${delivery.id}` : undefined}
      data-testid="webhook-delivery-drawer"
    >
      {delivery && (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-4">
            <Detail label="Status" value={<DeliveryStatusBadge status={delivery.status} testId="webhook-delivery-drawer-status" />} testId="webhook-delivery-drawer-status-cell" />
            <Detail label="Response code" value={delivery.lastStatusCode ?? '—'} testId="webhook-delivery-drawer-code" />
            <Detail label="Duration" value={delivery.durationMs != null ? `${delivery.durationMs} ms` : '—'} testId="webhook-delivery-drawer-duration" />
            <Detail label="Attempts" value={delivery.attempts ?? 0} testId="webhook-delivery-drawer-attempts" />
            <Detail label="Created" value={formatDateTime(delivery.createdAt)} testId="webhook-delivery-drawer-created" />
            <Detail label="Next attempt" value={formatDateTime(delivery.nextAttemptAt)} testId="webhook-delivery-drawer-next-attempt" />
            <Detail label="Delivered" value={formatDateTime(delivery.deliveredAt)} testId="webhook-delivery-drawer-delivered" />
            <Detail label="Event id" value={<span className="break-all font-mono text-xs">{delivery.eventId}</span>} testId="webhook-delivery-drawer-event-id" />
          </dl>

          {delivery.lastError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" data-testid="webhook-delivery-drawer-last-error">{delivery.lastError}</p>
          )}

          <section aria-labelledby="webhook-delivery-request-heading">
            <h3 id="webhook-delivery-request-heading" className="text-sm font-semibold text-slate-950">Request headers</h3>
            <table className="mt-2 w-full text-left text-xs" data-testid="webhook-delivery-drawer-headers">
              <tbody>
                {Object.entries(headers).map(([name, value]) => (
                  <tr key={name} className="border-b border-stone-100">
                    <th scope="row" className="py-1 pr-3 font-mono font-medium text-slate-600">{name}</th>
                    <td className="break-all py-1 font-mono text-slate-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 text-xs text-slate-500">The exact signature of each attempt is recorded by the built-in inbox.</p>
            <h3 className="mt-4 text-sm font-semibold text-slate-950">Request payload</h3>
            <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-stone-100" data-testid="webhook-delivery-drawer-payload">{prettyJson(delivery.payload)}</pre>
          </section>

          <section aria-labelledby="webhook-delivery-response-heading">
            <h3 id="webhook-delivery-response-heading" className="text-sm font-semibold text-slate-950">Response</h3>
            <pre className="mt-2 max-h-48 overflow-auto rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs leading-5 text-slate-900" data-testid="webhook-delivery-drawer-response">{delivery.responseSnippet ? prettyJson(delivery.responseSnippet) : 'No response body recorded.'}</pre>
          </section>

          <div className="space-y-2 border-t border-stone-200 pt-4">
            <Button type="button" onClick={redeliver} disabled={!canRedeliver || pending} data-testid="webhook-delivery-drawer-redeliver">
              {pending ? 'Redelivering…' : 'Redeliver'}
            </Button>
            {!canRedeliver && <p className="text-xs text-slate-500">Re-enable the subscription to redeliver events.</p>}
            {result && (
              <p role={result.ok ? 'status' : 'alert'} className={`text-sm ${result.ok ? 'text-emerald-700' : 'text-red-700'}`} data-testid="webhook-delivery-drawer-result">{result.message}</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
