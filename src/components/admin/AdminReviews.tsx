import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminReviews } from '../../lib/api';
import { serverMessage } from '../../lib/requestErrors';
import type { ReviewStatus } from '../../types/commerce';
import { formatDateTime, selectClassName } from '../../lib/commerceFormat';
import { PageHeader, StatusBadge } from '../commerce/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';
import { AdminSectionNav } from './AdminSectionNav';

export function AdminReviews() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ReviewStatus | ''>('PENDING');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const list = useQuery({ queryKey: ['admin-reviews', status], queryFn: () => adminReviews.list(status || undefined) });
  const moderate = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: 'APPROVED' | 'REJECTED' }) =>
      adminReviews.moderate(id, { decision, note: notes[id]?.trim() || undefined }),
    onSuccess: (_response, { id }) => {
      setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => Number(key) !== id)));
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (error, { id }) => setErrors((current) => ({ ...current, [id]: serverMessage(error, 'Moderation failed.') })),
  });
  const items = list.data?.data.content ?? [];

  return (
    <div className="space-y-6 pb-10" data-testid="admin-reviews">
      <AdminSectionNav />
      <PageHeader
        eyebrow="Community"
        title="Review moderation"
        description="Only approved reviews are public and count towards ratings. Rejecting needs a note the author can see."
        aside={
          <div className="w-48">
            <Label htmlFor="reviews-status-filter" className="sr-only">Status</Label>
            <select id="reviews-status-filter" value={status} onChange={(event) => setStatus(event.target.value as ReviewStatus | '')} className={selectClassName} data-testid="reviews-status-filter">
              <option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="">All</option>
            </select>
          </div>
        }
      />
      <Surface variant="default" padding="none" className="overflow-hidden">
        {list.isError && <p className="p-6 text-sm text-red-700" role="alert" data-testid="admin-reviews-error">Unable to load reviews.</p>}
        {!list.isLoading && items.length === 0 && <p className="p-6 text-sm text-slate-500" data-testid="admin-reviews-empty">Nothing to moderate.</p>}
        <ul className="divide-y divide-stone-100">
          {items.map((review) => {
            const id = review.id as number;
            return (
              <li key={id} className="space-y-2 p-5" data-testid={`admin-review-${id}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <Link to={`/products/${review.productId}`} className="font-medium text-slate-950 hover:underline" data-testid={`admin-review-product-${id}`}>{review.productName}</Link>
                    <span className="ml-2 text-slate-500">{'★'.repeat(review.rating ?? 0)} · {review.username} · {formatDateTime(review.createdAt)}</span>
                  </div>
                  <StatusBadge status={review.status} testId={`admin-review-status-${id}`} />
                </div>
                <p className="font-medium text-slate-900">{review.title}</p>
                <p className="whitespace-pre-line text-sm text-slate-600">{review.body}</p>
                {review.moderationNote && <p className="text-xs text-slate-500">Note: {review.moderationNote}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  <Input value={notes[id] ?? ''} onChange={(event) => setNotes({ ...notes, [id]: event.target.value })} placeholder="Note (required to reject)" maxLength={500} className="max-w-sm" aria-label="Moderation note" data-testid={`admin-review-note-${id}`} />
                  <Button size="sm" onClick={() => moderate.mutate({ id, decision: 'APPROVED' })} disabled={moderate.isPending} data-testid={`admin-review-approve-${id}`}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id, decision: 'REJECTED' })} disabled={moderate.isPending} data-testid={`admin-review-reject-${id}`}>Reject</Button>
                </div>
                {errors[id] && <p className="text-sm text-red-700" role="alert" data-testid={`admin-review-error-${id}`}>{errors[id]}</p>}
              </li>
            );
          })}
        </ul>
      </Surface>
    </div>
  );
}
