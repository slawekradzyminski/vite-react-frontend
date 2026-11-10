import { useState } from 'react';
import { Button } from '../ui/button';
import { CopyButton } from '../ui/copy-button';
import { ConfirmDialog } from '../ui/modal';
import { Surface } from '../ui/surface';
import { formatDateTime } from '../../lib/commerceFormat';
import { serverMessage } from '../../lib/requestErrors';
import { MAX_INBOXES } from '../../lib/webhookFormat';
import { useInboxMutations, useWebhookInboxes } from '../../hooks/useWebhooks';
import { WebhookInboxRequests } from './WebhookInboxRequests';

interface WebhookInboxesProps {
  /** Puts an inbox URL into the create form. */
  onUseUrl: (url: string) => void;
}

export function WebhookInboxes({ onUseUrl }: WebhookInboxesProps) {
  const inboxes = useWebhookInboxes();
  const { create, remove } = useInboxMutations();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = inboxes.data ?? [];
  const full = items.length >= MAX_INBOXES;

  const createInbox = () => {
    setError(null);
    create.mutate(undefined, {
      onSuccess: (inbox) => setOpen((current) => ({ ...current, [inbox.token as string]: true })),
      onError: (failure) => setError(serverMessage(failure, 'Unable to create an inbox.')),
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting, {
      onError: (failure) => setError(serverMessage(failure, 'Unable to delete the inbox.')),
      onSettled: () => setDeleting(null),
    });
  };

  return (
    <Surface as="section" variant="default" padding="lg" aria-labelledby="webhook-inboxes-heading" data-testid="webhook-inboxes">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 id="webhook-inboxes-heading" className="text-xl font-semibold text-slate-950">Built-in inboxes</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            No public server? Create an inbox and use its <code className="font-mono">inbox://</code> URL as a webhook URL.
            Deliveries are stored with the same headers and signature a real endpoint would receive.
          </p>
        </div>
        <Button type="button" onClick={createInbox} disabled={full || create.isPending} data-testid="webhook-inbox-create">
          {create.isPending ? 'Creating…' : 'Create inbox'}
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-500" data-testid="webhook-inbox-count">{items.length} of {MAX_INBOXES} inboxes used</p>

      {error && <p className="mt-3 text-sm text-red-700" role="alert" data-testid="webhook-inbox-error">{error}</p>}
      {inboxes.isError && <p className="mt-3 text-sm text-red-700" role="alert" data-testid="webhook-inboxes-error">Unable to load your inboxes.</p>}
      {!inboxes.isLoading && !inboxes.isError && items.length === 0 && (
        <p className="mt-3 text-sm text-slate-500" data-testid="webhook-inboxes-empty">You have no inboxes yet.</p>
      )}

      <ul className="mt-4 space-y-4">
        {items.map((inbox) => {
          const token = inbox.token as string;
          const url = inbox.url as string;
          const expanded = Boolean(open[token]);
          return (
            <li key={token} className="rounded-[1.25rem] border border-stone-200 bg-stone-50/80 p-4" data-testid={`webhook-inbox-${token}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <code className="break-all font-mono text-sm text-slate-900" data-testid={`webhook-inbox-url-${token}`}>{url}</code>
                  <p className="text-xs text-slate-500">Created {formatDateTime(inbox.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={url} label="Copy URL" subject="Inbox URL" data-testid={`webhook-inbox-copy-${token}`} />
                  <Button type="button" variant="outline" size="sm" onClick={() => onUseUrl(url)} data-testid={`webhook-inbox-use-${token}`}>Use as webhook URL</Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen((current) => ({ ...current, [token]: !expanded }))}
                    aria-expanded={expanded}
                    data-testid={`webhook-inbox-toggle-${token}`}
                  >
                    {expanded ? 'Hide requests' : 'View requests'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setDeleting(token)} data-testid={`webhook-inbox-delete-${token}`}>Delete</Button>
                </div>
              </div>
              {expanded && <div className="mt-3"><WebhookInboxRequests token={token} /></div>}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete inbox?"
        message="Its received requests are deleted, and webhooks that still target it start failing."
        confirmLabel="Delete inbox"
        pending={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        data-testid="webhook-inbox-confirm"
      />
    </Surface>
  );
}
