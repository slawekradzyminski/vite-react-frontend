import { useState } from 'react';
import { MapPin, PackageCheck, Tag, TriangleAlert, Truck, type LucideIcon } from 'lucide-react';
import type { PublicTracking, Tracking, TrackingStatus } from '../../types/commerce';
import { formatDateTime } from '../../lib/commerceFormat';
import { trackingStatusLabel } from '../../lib/tracking';
import { Button } from '../ui/button';

const STATUS_ICONS: Record<TrackingStatus, LucideIcon> = {
  LABEL_CREATED: Tag,
  IN_TRANSIT: Truck,
  OUT_FOR_DELIVERY: MapPin,
  DELIVERY_FAILED: TriangleAlert,
  DELIVERED: PackageCheck,
};

function CopyTrackingNumber({ value }: { value: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed');
    }
  };
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={copy} aria-label={`Copy tracking number ${value}`} data-testid="tracking-copy-number">
        Copy
      </Button>
      <span className="text-xs text-slate-500" role="status" data-testid="tracking-copy-status">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed; select the number instead' : ''}
      </span>
    </>
  );
}

/** Carrier scans for one parcel, newest first, with the carrier, number and expected delivery. */
export function TrackingTimeline({ tracking }: { tracking: Tracking | PublicTracking }) {
  const events = [...(tracking.events ?? [])].reverse();
  const delivered = tracking.currentStatus === 'DELIVERED';
  const failed = tracking.currentStatus === 'DELIVERY_FAILED';

  return (
    <div className="space-y-4" data-testid="tracking-timeline">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span
          className={`rounded-full px-3 py-1 font-semibold ${failed ? 'bg-red-100 text-red-800' : delivered ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-900 text-stone-50'}`}
          data-testid="tracking-current-status"
        >
          {trackingStatusLabel(tracking.currentStatus)}
        </span>
        {tracking.carrier && <span className="font-medium text-slate-900" data-testid="tracking-carrier">{tracking.carrier}</span>}
        {tracking.trackingNumber && (
          <span className="flex items-center gap-2">
            <code className="rounded bg-stone-100 px-2 py-1 text-slate-800" data-testid="tracking-number">{tracking.trackingNumber}</code>
            <CopyTrackingNumber value={tracking.trackingNumber} />
          </span>
        )}
      </div>
      {tracking.estimatedDelivery && (
        <p className="text-sm text-slate-600" data-testid="tracking-estimated-delivery">
          {delivered ? 'Delivered' : 'Estimated delivery'}: {formatDateTime(tracking.estimatedDelivery)}
        </p>
      )}
      {events.length === 0 ? (
        <p className="text-sm text-slate-500" data-testid="tracking-no-events">The carrier has not scanned the parcel yet.</p>
      ) : (
        <ol className="relative space-y-3 border-l border-stone-200 pl-6" aria-label="Tracking events" data-testid="tracking-events">
          {events.map((event, index) => {
            const status = event.status ?? 'IN_TRANSIT';
            const Icon = STATUS_ICONS[status] ?? Truck;
            const isFailure = status === 'DELIVERY_FAILED';
            return (
              <li
                key={`${event.occurredAt}-${status}-${index}`}
                className={`relative rounded-2xl px-3 py-2 ${isFailure ? 'border border-red-200 bg-red-50' : index === 0 ? 'bg-stone-50' : ''}`}
                data-testid={`tracking-event-${events.length - 1 - index}`}
                data-status={status}
              >
                <span
                  className={`absolute -left-[2.15rem] top-2 flex h-6 w-6 items-center justify-center rounded-full border bg-white ${isFailure ? 'border-red-300 text-red-700' : 'border-stone-300 text-slate-700'}`}
                  aria-hidden="true"
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <p className={`text-sm font-semibold ${isFailure ? 'text-red-800' : 'text-slate-900'}`} data-testid="tracking-event-status">
                  {trackingStatusLabel(status)}
                </p>
                {event.description && <p className="text-sm text-slate-700" data-testid="tracking-event-description">{event.description}</p>}
                <p className="text-xs text-slate-500">
                  {event.location && <span data-testid="tracking-event-location">{event.location} · </span>}
                  <time dateTime={event.occurredAt} data-testid="tracking-event-time">{formatDateTime(event.occurredAt)}</time>
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
