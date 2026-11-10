import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { tracking } from '../../lib/api';
import { normaliseTrackingNumber, publicTrackingQueryKey, trackingRefreshInterval } from '../../lib/tracking';
import { responseStatus } from '../../lib/requestErrors';
import { fieldErrorId } from '../../lib/fieldError';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { trackingLookupSchema, type TrackingLookupForm, type TrackingLookupInput } from '../../validators/tracking';
import { TrackingTimeline } from '../../components/tracking/TrackingTimeline';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Surface } from '../../components/ui/surface';

function TrackingResult({ trackingNumber }: { trackingNumber: string }) {
  const query = useQuery({
    queryKey: publicTrackingQueryKey(trackingNumber),
    queryFn: async () => (await tracking.byNumber(trackingNumber)).data,
    retry: false,
    refetchInterval: (current) => (current.state.data ? trackingRefreshInterval(current.state.data.currentStatus) : false),
  });

  if (query.isLoading) {
    return <p className="text-sm text-slate-500" role="status" data-testid="public-tracking-loading">Looking up {trackingNumber}…</p>;
  }
  if (query.isError) {
    const notFound = responseStatus(query.error) === 404;
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert" data-testid={notFound ? 'public-tracking-not-found' : 'public-tracking-error'}>
        {notFound
          ? `No parcel with tracking number ${trackingNumber} was found. Check the number and try again.`
          : 'Tracking is unavailable right now. Please try again in a moment.'}
      </p>
    );
  }
  return query.data ? <TrackingTimeline tracking={query.data} /> : null;
}

/** Public parcel tracking: no login needed, deep-linkable as /track/:number. */
export function TrackingPage() {
  useDocumentTitle('Track a parcel');
  const navigate = useNavigate();
  const params = useParams<{ number?: string }>();
  const current = params.number ? normaliseTrackingNumber(params.number) : '';
  const { register, handleSubmit, formState: { errors } } = useForm<TrackingLookupInput, unknown, TrackingLookupForm>({
    resolver: zodResolver(trackingLookupSchema),
    defaultValues: { trackingNumber: current },
  });

  const onSubmit = ({ trackingNumber }: TrackingLookupForm) => {
    navigate(`/track/${encodeURIComponent(trackingNumber)}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10" data-testid="public-tracking-page">
      <Surface as="section" variant="hero" padding="xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Delivery</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950" data-testid="public-tracking-title">Track a parcel</h1>
        <p className="mt-2 text-sm text-slate-600">Enter the carrier tracking number from your shipping email. No account needed.</p>
        <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="public-tracking-form">
          <div className="flex-1">
            <Label htmlFor="tracking-number-input">Tracking number</Label>
            <Input
              id="tracking-number-input"
              className="mt-2"
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. 1234567890"
              error={errors.trackingNumber?.message}
              {...register('trackingNumber')}
              data-testid="public-tracking-input"
            />
          </div>
          <Button type="submit" className="h-11" data-testid="public-tracking-submit">Track</Button>
        </form>
        {errors.trackingNumber && (
          <p className="mt-2 text-sm text-red-600" id={fieldErrorId('tracking-number-input')} data-testid="public-tracking-input-error">{errors.trackingNumber.message}</p>
        )}
      </Surface>
      {current && (
        <Surface variant="default" padding="lg" data-testid="public-tracking-result">
          <TrackingResult key={current} trackingNumber={current} />
        </Surface>
      )}
    </div>
  );
}

export default TrackingPage;
