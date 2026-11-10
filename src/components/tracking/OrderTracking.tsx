import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { tracking } from '../../lib/api';
import { orderTrackingQueryKey, trackingRefreshInterval } from '../../lib/tracking';
import { TrackingTimeline } from './TrackingTimeline';

/** Carrier timeline of a shipped order; refreshes every 30 seconds until the parcel is delivered. */
export function OrderTracking({ orderId }: { orderId: number }) {
  const query = useQuery({
    queryKey: orderTrackingQueryKey(orderId),
    queryFn: async () => (await tracking.forOrder(orderId)).data,
    retry: false,
    refetchInterval: (current) => trackingRefreshInterval(current.state.data?.currentStatus),
  });

  if (query.isLoading) return <p className="text-sm text-slate-500" data-testid="order-tracking-loading">Loading carrier updates…</p>;
  if (query.isError || !query.data) {
    return <p className="text-sm text-slate-500" data-testid="order-tracking-unavailable">Carrier updates are not available yet.</p>;
  }
  const number = query.data.trackingNumber;

  return (
    <div className="mt-4 border-t border-stone-200 pt-4" data-testid="order-tracking">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-950">Carrier tracking</h3>
        {number && (
          <Link to={`/track/${encodeURIComponent(number)}`} className="text-xs font-medium text-sky-700 underline-offset-4 hover:underline" data-testid="order-tracking-public-link">
            Shareable tracking page
          </Link>
        )}
      </div>
      <TrackingTimeline tracking={query.data} />
    </div>
  );
}
