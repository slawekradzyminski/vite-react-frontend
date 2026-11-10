import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ConfirmDialog, Modal } from '../ui/modal';
import { formatDateTime } from '../../lib/commerceFormat';
import { serverMessage } from '../../lib/requestErrors';
import { useWebhookMutations } from '../../hooks/useWebhooks';
import type { WebhookDelivery, WebhookEventType, WebhookSubscription } from '../../types/commerce';
import type { WebhookFormData } from '../../validators/webhook';
import { WebhookDeliveries } from './WebhookDeliveries';
import { WebhookForm } from './WebhookForm';
import { WebhookSecretCallout } from './WebhookSecretCallout';
import { DeliveryStatusBadge } from './webhookStatus';

interface WebhookSubscriptionCardProps {
  subscription: WebhookSubscription;
  eventTypes: WebhookEventType[];
}

type Pending = 'delete' | 'rotate' | null;

export function WebhookSubscriptionCard({ subscription, eventTypes }: WebhookSubscriptionCardProps) {
  const id = subscription.id as number;
  const prefix = `webhook-${id}`;
  const { update, remove, rotateSecret, sendTest } = useWebhookMutations();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<Pending>(null);
  const [showDeliveries, setShowDeliveries] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<WebhookDelivery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = Boolean(subscription.active);

  const save = (values: WebhookFormData) => update.mutateAsync({
    id,
    data: { url: values.url, events: values.events, description: values.description || null, active: values.active },
  }).then(() => setEditing(false));

  const confirmAction = () => {
    setError(null);
    if (confirm === 'delete') {
      remove.mutate(id, { onError: (failure) => setError(serverMessage(failure, 'Unable to delete the webhook.')), onSettled: () => setConfirm(null) });
    } else if (confirm === 'rotate') {
      rotateSecret.mutate(id, {
        onSuccess: (updated) => setNewSecret(updated.secret ?? null),
        onError: (failure) => setError(serverMessage(failure, 'Unable to rotate the secret.')),
        onSettled: () => setConfirm(null),
      });
    }
  };

  const runTest = () => {
    setError(null);
    setTestResult(null);
    sendTest.mutate(id, {
      onSuccess: (delivery) => { setTestResult(delivery); setShowDeliveries(true); },
      onError: (failure) => setError(serverMessage(failure, 'Unable to send a test event.')),
    });
  };

  return (
    <article className="space-y-4 rounded-[1.5rem] border border-stone-200 bg-white/90 p-5" aria-labelledby={`${prefix}-url`} data-testid={prefix}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 id={`${prefix}-url`} className="break-all font-mono text-sm font-semibold text-slate-950" data-testid={`${prefix}-url`}>{subscription.url}</h3>
          {subscription.description && <p className="text-sm text-slate-600" data-testid={`${prefix}-description`}>{subscription.description}</p>}
          <div className="flex flex-wrap gap-1 pt-1" data-testid={`${prefix}-events`}>
            {(subscription.events ?? []).map((event) => <Badge key={event} variant="outline" className="font-mono">{event}</Badge>)}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 md:items-end">
          <Badge variant={active ? 'success' : 'error'} data-testid={`${prefix}-active`}>{active ? 'Active' : 'Disabled'}</Badge>
          <span className="text-xs text-slate-500" data-testid={`${prefix}-failures`}>{subscription.consecutiveFailures ?? 0} consecutive failures</span>
          <span className="text-xs text-slate-500">Created {formatDateTime(subscription.createdAt)}</span>
        </div>
      </div>

      {subscription.disabledReason && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" data-testid={`${prefix}-disabled-reason`}>
          Disabled: {subscription.disabledReason}
        </p>
      )}

      {newSecret && <WebhookSecretCallout secret={newSecret} title="New signing secret" onDismiss={() => setNewSecret(null)} data-testid={`${prefix}-secret`} />}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={runTest} disabled={!active || sendTest.isPending} data-testid={`${prefix}-test`}>
          {sendTest.isPending ? 'Sending…' : 'Send test'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowDeliveries((open) => !open)} aria-expanded={showDeliveries} aria-controls={`webhook-deliveries-${id}`} data-testid={`${prefix}-toggle-deliveries`}>
          {showDeliveries ? 'Hide deliveries' : 'Deliveries'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)} data-testid={`${prefix}-edit`}>Edit</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirm('rotate')} data-testid={`${prefix}-rotate`}>Rotate secret</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirm('delete')} data-testid={`${prefix}-delete`}>Delete</Button>
      </div>

      {testResult && (
        <p role="status" className="text-sm text-slate-700" data-testid={`${prefix}-test-result`}>
          Test ping {testResult.id}: <DeliveryStatusBadge status={testResult.status} testId={`${prefix}-test-status`} />
          {testResult.lastStatusCode != null && <> HTTP {testResult.lastStatusCode}</>}
          {testResult.durationMs != null && <> in {testResult.durationMs} ms</>}
          {testResult.lastError && <> — {testResult.lastError}</>}
        </p>
      )}
      {error && <p className="text-sm text-red-700" role="alert" data-testid={`${prefix}-error`}>{error}</p>}

      {showDeliveries && <WebhookDeliveries subscriptionId={id} active={active} />}

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit webhook" data-testid={`${prefix}-edit-dialog`}>
        <WebhookForm
          idPrefix={`${prefix}-edit`}
          mode="edit"
          eventTypes={eventTypes}
          initialValues={{ url: subscription.url ?? '', events: subscription.events ?? [], description: subscription.description ?? '', active }}
          onSubmit={save}
          onCancel={() => setEditing(false)}
        />
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === 'delete' ? 'Delete webhook?' : 'Rotate signing secret?'}
        message={confirm === 'delete'
          ? `Deliveries to ${subscription.url} stop and its delivery log is deleted. This cannot be undone.`
          : 'The current secret stops working at once. Retries are signed with the new secret.'}
        confirmLabel={confirm === 'delete' ? 'Delete webhook' : 'Rotate secret'}
        pending={remove.isPending || rotateSecret.isPending}
        onConfirm={confirmAction}
        onCancel={() => setConfirm(null)}
        data-testid={`${prefix}-confirm`}
      />
    </article>
  );
}
