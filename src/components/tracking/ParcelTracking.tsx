import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { tracking } from '../../lib/api';
import { publicTrackingQueryKey, trackingRefreshInterval } from '../../lib/tracking';
import { TrackingTimeline } from './TrackingTimeline';

interface ParcelTrackingProps {
  trackingNumber: string;
  /** Prefix of this parcel's test ids, e.g. `parcel-2`. */
  testIdPrefix: string;
}

/**
 * Carrier timeline of one shipped parcel, read by tracking number, so every parcel of a split order
 * has its own. Refreshes every 30 seconds until the parcel is delivered.
 */
export function ParcelTracking({ trackingNumber, testIdPrefix }: ParcelTrackingProps) {
  const query = useQuery({
    queryKey: publicTrackingQueryKey(trackingNumber),
    queryFn: async () => (await tracking.byNumber(trackingNumber)).data,
    retry: false,
    refetchInterval: (current) => trackingRefreshInterval(current.state.data?.currentStatus),
  });

  if (query.isLoading) {
    return <p className="text-sm text-slate-500" data-testid={`${testIdPrefix}-tracking-loading`}>Loading carrier updates…</p>;
  }
  if (query.isError || !query.data) {
    return <p className="text-sm text-slate-500" data-testid={`${testIdPrefix}-tracking-unavailable`}>Carrier updates are not available yet.</p>;
  }

  return (
    <div className="mt-4 border-t border-stone-200 pt-4" data-testid={`${testIdPrefix}-tracking`}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-base font-semibold text-slate-950">Carrier tracking</h4>
        <Link
          to={`/track/${encodeURIComponent(trackingNumber)}`}
          className="text-xs font-medium text-sky-700 underline-offset-4 hover:underline"
          data-testid={`${testIdPrefix}-tracking-public-link`}
        >
          Shareable tracking page
        </Link>
      </div>
      <TrackingTimeline tracking={query.data} />
    </div>
  );
}
