import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { notifications } from '../../lib/api';
import { formatDateTime } from '../../lib/commerceFormat';
import { StatusBadge } from '../commerce/shared';
import { AdminPager } from '../admin/AdminPager';
import { NOTIFICATION_EMAILS_QUERY_KEY, notificationTemplateLabel } from '../../lib/notifications';

const PAGE_SIZE = 10;

/** The caller's commerce emails sent by notification-service, newest first. */
export function NotificationEmails() {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: [...NOTIFICATION_EMAILS_QUERY_KEY, page],
    queryFn: async () => (await notifications.emails(page, PAGE_SIZE)).data,
    placeholderData: keepPreviousData,
    retry: false,
  });

  if (query.isLoading) return <p className="text-sm text-slate-500" data-testid="notifications-loading">Loading notifications…</p>;
  if (query.isError) return <p className="text-sm text-red-700" role="alert" data-testid="notifications-error">Your notifications could not be loaded.</p>;

  const emails = query.data?.content ?? [];
  const totalPages = query.data?.totalPages ?? 0;
  if (emails.length === 0) {
    return <p className="text-sm text-slate-500" data-testid="notifications-empty">No notifications yet. Emails about payments, shipments, returns and points show up here.</p>;
  }

  return (
    <div>
      <ul className="divide-y divide-stone-200" data-testid="notifications-list">
        {emails.map((email) => (
          <li key={email.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between" data-testid={`notification-${email.id}`}>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500" data-testid={`notification-template-${email.id}`}>
                {notificationTemplateLabel(email.template)}
              </p>
              <p className="[overflow-wrap:anywhere] font-medium text-slate-900" data-testid={`notification-subject-${email.id}`}>{email.subject}</p>
              <p className="text-xs text-slate-500" data-testid={`notification-meta-${email.id}`}>
                To {email.recipientMasked} · {formatDateTime(email.sentAt ?? email.createdAt)}
              </p>
              {email.status === 'FAILED' && email.failureReason && (
                <p className="text-xs text-red-700" data-testid={`notification-failure-${email.id}`}>{email.failureReason}</p>
              )}
            </div>
            <StatusBadge status={email.status} testId={`notification-status-${email.id}`} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && <AdminPager page={page} totalPages={totalPages} onPageChange={setPage} testIdPrefix="notifications" />}
    </div>
  );
}
