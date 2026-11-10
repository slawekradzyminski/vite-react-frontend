import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminWebhooks } from '../../lib/api';
import { formatDateTime } from '../../lib/commerceFormat';
import { PageHeader } from '../commerce/shared';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';
import { AdminPager } from './AdminPager';
import { AdminSectionNav } from './AdminSectionNav';

const PAGE_SIZE = 20;

export function AdminWebhooks() {
  const [draft, setDraft] = useState('');
  const [username, setUsername] = useState('');
  const [page, setPage] = useState(0);
  const list = useQuery({
    queryKey: ['admin-webhooks', username, page],
    queryFn: async () => (await adminWebhooks.list(username || undefined, page, PAGE_SIZE)).data,
    placeholderData: keepPreviousData,
  });
  const items = list.data?.content ?? [];

  const apply = (value: string) => { setUsername(value.trim()); setPage(0); };

  return (
    <div className="space-y-6 pb-10" data-testid="admin-webhooks">
      <AdminSectionNav />
      <PageHeader eyebrow="Integrations" title="Webhooks" description="Subscriptions of every user, with their failure counters and why any were disabled." />
      <Surface variant="default" padding="none" className="overflow-hidden">
        <form className="flex flex-wrap items-end gap-3 border-b border-stone-200 p-4" role="search" onSubmit={(event) => { event.preventDefault(); apply(draft); }} data-testid="admin-webhooks-filter">
          <div className="w-64">
            <Label htmlFor="admin-webhooks-username">Username</Label>
            <Input id="admin-webhooks-username" className="mt-1" value={draft} onChange={(event) => setDraft(event.target.value)} autoComplete="off" data-testid="admin-webhooks-username" />
          </div>
          <Button type="submit" data-testid="admin-webhooks-apply">Filter</Button>
          {username && <Button type="button" variant="outline" onClick={() => { setDraft(''); apply(''); }} data-testid="admin-webhooks-clear">Clear</Button>}
        </form>
        {list.isLoading && <p className="p-6 text-sm text-slate-500" data-testid="admin-webhooks-loading">Loading webhooks…</p>}
        {list.isError && <p className="p-6 text-sm text-red-700" role="alert" data-testid="admin-webhooks-error">Unable to load webhooks.</p>}
        {!list.isLoading && !list.isError && items.length === 0 && <p className="p-6 text-sm text-slate-500" data-testid="admin-webhooks-empty">No webhooks match this filter.</p>}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr><th scope="col" className="px-4 py-3">User</th><th scope="col" className="px-4 py-3">URL</th><th scope="col" className="px-4 py-3">Events</th><th scope="col" className="px-4 py-3">State</th><th scope="col" className="px-4 py-3">Created</th></tr>
              </thead>
              <tbody>
                {items.map((subscription) => (
                  <tr key={subscription.id} className="border-b border-stone-100 align-top" data-testid={`admin-webhook-row-${subscription.id}`}>
                    <td className="px-4 py-3 font-medium text-slate-900" data-testid={`admin-webhook-username-${subscription.id}`}>{subscription.username}</td>
                    <td className="max-w-xs break-all px-4 py-3 font-mono text-xs text-slate-700">{subscription.url}{subscription.description && <span className="block font-sans text-slate-500">{subscription.description}</span>}</td>
                    <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{(subscription.events ?? []).map((event) => <Badge key={event} variant="outline" className="font-mono">{event}</Badge>)}</div></td>
                    <td className="px-4 py-3">
                      <Badge variant={subscription.active ? 'success' : 'error'} data-testid={`admin-webhook-active-${subscription.id}`}>{subscription.active ? 'Active' : 'Disabled'}</Badge>
                      <span className="block text-xs text-slate-500">{subscription.consecutiveFailures ?? 0} failures</span>
                      {subscription.disabledReason && <span className="block text-xs text-red-700">{subscription.disabledReason}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(subscription.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPager page={page} totalPages={list.data?.totalPages ?? 0} onPageChange={setPage} testIdPrefix="admin-webhooks" />
      </Surface>
    </div>
  );
}
