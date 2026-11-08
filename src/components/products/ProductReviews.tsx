import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { reviews } from '../../lib/api';
import { serverMessage } from '../../lib/requestErrors';
import { validateReview } from '../../lib/commerceValidation';
import type { ReviewRequest } from '../../types/commerce';
import { StatusBadge } from '../commerce/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';
import { Textarea } from '../ui/textarea';

function Stars({ rating, testId }: { rating: number; testId: string }) {
  return (
    <span className="inline-flex" aria-label={`${rating} out of 5 stars`} data-testid={testId}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star key={value} className={`h-4 w-4 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} aria-hidden="true" />
      ))}
    </span>
  );
}

export function ProductReviews({ productId }: { productId: number }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ReviewRequest>({ rating: 0, title: '', body: '' });
  const [editing, setEditing] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const summary = useQuery({ queryKey: ['review-summary', productId], queryFn: () => reviews.summary(productId) });
  const list = useQuery({ queryKey: ['reviews', productId], queryFn: () => reviews.list(productId) });
  const mine = useQuery({ queryKey: ['my-review', productId], queryFn: () => reviews.mine(productId) });
  const invalidate = () => {
    ['review-summary', 'reviews', 'my-review'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key, productId] }));
  };
  const save = useMutation({
    mutationFn: (data: ReviewRequest) => (mine.data?.data.review ? reviews.update(productId, data) : reviews.create(productId, data)),
    onSuccess: () => {
      setEditing(false);
      setTouched(false);
      setError(null);
      invalidate();
    },
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to save your review.')),
  });
  const remove = useMutation({ mutationFn: () => reviews.remove(productId), onSuccess: invalidate });

  const myReview = mine.data?.data.review;
  const canReview = Boolean(mine.data?.data.canReview);
  const showForm = canReview || editing;
  const errors = validateReview(form);
  const stats = summary.data?.data;
  const items = list.data?.data.content ?? [];

  const startEdit = () => {
    if (!myReview) return;
    setForm({ rating: myReview.rating ?? 0, title: myReview.title ?? '', body: myReview.body ?? '' });
    setEditing(true);
  };

  return (
    <Surface variant="default" padding="lg" data-testid="product-reviews">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Customer reviews</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Ratings</h2>
        </div>
        <div className="text-right" data-testid="reviews-summary">
          {stats?.averageRating != null ? (
            <>
              <span className="text-3xl font-semibold text-slate-950" data-testid="reviews-average">{stats.averageRating.toFixed(1)}</span>
              <span className="ml-2 text-sm text-slate-500" data-testid="reviews-count">{stats.reviewCount} review{stats.reviewCount === 1 ? '' : 's'}</span>
            </>
          ) : (
            <span className="text-sm text-slate-500" data-testid="reviews-none">No reviews yet</span>
          )}
        </div>
      </div>

      {stats && (stats.reviewCount ?? 0) > 0 && (
        <div className="mt-4 space-y-1" data-testid="reviews-distribution">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.distribution?.[rating] ?? 0;
            const percent = stats.reviewCount ? Math.round((count / stats.reviewCount) * 100) : 0;
            return (
              <div key={rating} className="flex items-center gap-3 text-xs text-slate-600" data-testid={`reviews-distribution-${rating}`}>
                <span className="w-6">{rating}★</span>
                <div className="h-2 flex-1 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${percent}%` }} /></div>
                <span className="w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {myReview && !editing && (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4" data-testid="my-review">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-950">Your review</span><StatusBadge status={myReview.status} testId="my-review-status" /></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={startEdit} data-testid="my-review-edit">Edit</Button>
              <Button variant="outline" size="sm" onClick={() => remove.mutate()} disabled={remove.isPending} data-testid="my-review-delete">Delete</Button>
            </div>
          </div>
          <Stars rating={myReview.rating ?? 0} testId="my-review-stars" />
          <p className="mt-1 font-medium text-slate-900">{myReview.title}</p>
          {myReview.status === 'REJECTED' && myReview.moderationNote && (
            <p className="mt-2 text-sm text-red-700" role="status" data-testid="my-review-rejection">Rejected: {myReview.moderationNote}</p>
          )}
          {myReview.status === 'PENDING' && <p className="mt-2 text-xs text-slate-500">Visible to others after moderation.</p>}
        </div>
      )}

      {!myReview && !canReview && mine.data && (
        <p className="mt-6 text-sm text-slate-500" data-testid="review-not-eligible">{mine.data.data.reason}</p>
      )}

      {showForm && (
        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);
            if (Object.keys(errors).length === 0) save.mutate({ ...form, title: form.title.trim(), body: form.body.trim() });
          }}
          data-testid="review-form"
        >
          <div>
            <Label htmlFor="review-rating">Rating</Label>
            <select id="review-rating" value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })} className="mt-2 h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm" data-testid="review-rating">
              <option value={0}>Choose…</option>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>)}
            </select>
            {touched && errors.rating && <p className="mt-1 text-xs text-red-700" role="alert" data-testid="review-rating-error">{errors.rating}</p>}
          </div>
          <div>
            <Label htmlFor="review-title">Title</Label>
            <Input id="review-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={120} className="mt-2" data-testid="review-title" />
            {touched && errors.title && <p className="mt-1 text-xs text-red-700" role="alert" data-testid="review-title-error">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="review-body">Review</Label>
            <Textarea id="review-body" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} maxLength={2000} className="mt-2" data-testid="review-body" />
            {touched && errors.body && <p className="mt-1 text-xs text-red-700" role="alert" data-testid="review-body-error">{errors.body}</p>}
          </div>
          {error && <p className="text-sm text-red-700" role="alert" data-testid="review-error">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending} data-testid="review-submit">{myReview ? 'Save changes' : 'Submit review'}</Button>
            {editing && <Button type="button" variant="outline" onClick={() => setEditing(false)} data-testid="review-cancel">Cancel</Button>}
          </div>
        </form>
      )}

      <div className="mt-8 space-y-4" data-testid="reviews-list">
        {list.isError && <p className="text-sm text-red-700" role="alert" data-testid="reviews-error">Unable to load reviews.</p>}
        {items.map((review) => (
          <article key={review.id} className="border-t border-stone-100 pt-4" data-testid={`review-${review.id}`}>
            <div className="flex items-center justify-between gap-2">
              <Stars rating={review.rating ?? 0} testId={`review-stars-${review.id}`} />
              <span className="text-xs text-slate-500">{review.username} · {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</span>
            </div>
            <p className="mt-1 font-medium text-slate-900">{review.title}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{review.body}</p>
          </article>
        ))}
      </div>
    </Surface>
  );
}
