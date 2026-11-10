import { useRef, useState } from 'react';
import { PageHeader } from '../../components/commerce/shared';
import { Surface } from '../../components/ui/surface';
import { WebhookForm } from '../../components/webhooks/WebhookForm';
import { WebhookInboxes } from '../../components/webhooks/WebhookInboxes';
import { WebhookSecretCallout } from '../../components/webhooks/WebhookSecretCallout';
import { WebhookSignatureHelp } from '../../components/webhooks/WebhookSignatureHelp';
import { WebhookSubscriptionCard } from '../../components/webhooks/WebhookSubscriptionCard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useWebhookEventTypes, useWebhookMutations, useWebhookSubscriptions } from '../../hooks/useWebhooks';
import { EMPTY_WEBHOOK_FORM, type WebhookFormData } from '../../validators/webhook';

export function WebhooksPage() {
  useDocumentTitle('Webhooks');
  const subscriptions = useWebhookSubscriptions();
  const eventTypes = useWebhookEventTypes();
  const { create } = useWebhookMutations();
  const [created, setCreated] = useState<{ url: string; secret: string } | null>(null);
  // Remounting the form with new initial values is how "use as webhook URL" fills it in.
  const [formSeed, setFormSeed] = useState<{ key: number; values: WebhookFormData }>({ key: 0, values: EMPTY_WEBHOOK_FORM });
  const formRef = useRef<HTMLDivElement>(null);

  const submit = async (values: WebhookFormData) => {
    const subscription = await create.mutateAsync({ url: values.url, events: values.events, description: values.description || null });
    setCreated({ url: subscription.url ?? values.url, secret: subscription.secret ?? '' });
    setFormSeed((current) => ({ key: current.key + 1, values: EMPTY_WEBHOOK_FORM }));
  };

  const fillInboxUrl = (url: string) => {
    setFormSeed((current) => ({ key: current.key + 1, values: { ...EMPTY_WEBHOOK_FORM, url } }));
    formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    requestAnimationFrame(() => document.getElementById('webhook-create-url')?.focus());
  };

  const items = subscriptions.data ?? [];
  const types = eventTypes.data ?? [];

  return (
    <div className="space-y-6 pb-10" data-testid="webhooks-page">
      <PageHeader
        eyebrow="Account"
        title="Webhooks"
        description="Receive signed HTTP callbacks when your orders change. Every event is logged as a delivery you can inspect and redeliver."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <Surface as="section" variant="default" padding="lg" className="min-w-0" aria-labelledby="webhook-subscriptions-heading" data-testid="webhook-subscriptions">
          <h2 id="webhook-subscriptions-heading" className="text-xl font-semibold text-slate-950">Your subscriptions</h2>
          {subscriptions.isLoading && <p className="mt-3 text-sm text-slate-500" data-testid="webhook-subscriptions-loading">Loading webhooks…</p>}
          {subscriptions.isError && <p className="mt-3 text-sm text-red-700" role="alert" data-testid="webhook-subscriptions-error">Unable to load your webhooks.</p>}
          {!subscriptions.isLoading && !subscriptions.isError && items.length === 0 && (
            <p className="mt-3 text-sm text-slate-500" data-testid="webhook-subscriptions-empty">No webhooks yet. Create one to start receiving events.</p>
          )}
          <div className="mt-4 space-y-4">
            {items.map((subscription) => (
              <WebhookSubscriptionCard key={subscription.id} subscription={subscription} eventTypes={types} />
            ))}
          </div>
        </Surface>

        <div className="min-w-0 space-y-6" ref={formRef}>
          <Surface as="section" variant="default" padding="lg" aria-labelledby="webhook-create-heading" data-testid="webhook-create">
            <h2 id="webhook-create-heading" className="mb-4 text-xl font-semibold text-slate-950">New webhook</h2>
            {created && (
              <div className="mb-4">
                <WebhookSecretCallout
                  secret={created.secret}
                  title={`Signing secret for ${created.url}`}
                  onDismiss={() => setCreated(null)}
                  data-testid="webhook-created-secret"
                />
              </div>
            )}
            <WebhookForm
              key={formSeed.key}
              idPrefix="webhook-create"
              mode="create"
              initialValues={formSeed.values}
              eventTypes={types}
              eventTypesError={eventTypes.isError}
              onSubmit={submit}
            />
          </Surface>
          <WebhookSignatureHelp />
        </div>
      </div>

      <WebhookInboxes onUseUrl={fillInboxUrl} />
    </div>
  );
}

export default WebhooksPage;
