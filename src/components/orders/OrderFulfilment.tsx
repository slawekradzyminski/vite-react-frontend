import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returns, warehouse } from '../../lib/api';
import { responseStatus, serverMessage } from '../../lib/requestErrors';
import type { ReturnReason, Shipment } from '../../types/commerce';
import type { Order } from '../../types/order';
import { formatDateTime, selectClassName } from '../../lib/commerceFormat';
import { StatusBadge } from '../commerce/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';
import { Textarea } from '../ui/textarea';
import { ParcelTracking } from '../tracking/ParcelTracking';

const REASONS: { value: ReturnReason; label: string }[] = [
  { value: 'DAMAGED', label: 'Arrived damaged' },
  { value: 'WRONG_ITEM', label: 'Wrong item' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
  { value: 'NO_LONGER_NEEDED', label: 'No longer needed' },
];

const STEPS = ['AWAITING_PICK', 'PICKED', 'PACKED', 'SHIPPED', 'DELIVERED'] as const;

/** One parcel of the order: where it ships from, what it holds, and its progress and carrier timeline. */
function OrderParcel({ parcel, position, count }: { parcel: Shipment; position: number; count: number }) {
  const index = parcel.parcelIndex || position;
  const total = parcel.parcelCount || count;
  const prefix = `parcel-${index}`;
  const stepIndex = parcel.status ? STEPS.indexOf(parcel.status as (typeof STEPS)[number]) : -1;
  const shipped = parcel.status === 'SHIPPED' || parcel.status === 'DELIVERED';
  const location = parcel.locationName
    ? `${parcel.locationName}${parcel.locationCode ? ` (${parcel.locationCode})` : ''}`
    : parcel.locationCode;

  return (
    <li className="space-y-3 rounded-2xl border border-stone-200 bg-white/70 p-4" data-testid={prefix}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-950" data-testid={`${prefix}-title`}>
          Parcel {index} of {total}
        </h3>
        <StatusBadge status={parcel.status} testId={`${prefix}-status`} />
      </div>
      {location && <p className="text-sm text-slate-600" data-testid={`${prefix}-location`}>Ships from {location}</p>}
      {parcel.lines && parcel.lines.length > 0 && (
        <ul className="space-y-1 text-sm text-slate-700" data-testid={`${prefix}-lines`}>
          {parcel.lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-3" data-testid={`${prefix}-line-${line.productId}`}>
              <span className="[overflow-wrap:anywhere]">{line.productName}</span>
              <span className="shrink-0 tabular-nums">× {line.quantity}</span>
            </li>
          ))}
        </ul>
      )}
      {parcel.trackingNumber && (
        <p className="text-sm text-slate-700" data-testid={`${prefix}-tracking-number`}>{parcel.carrier} · {parcel.trackingNumber}</p>
      )}
      {parcel.status !== 'CANCELLED' && (
        <ol className="grid grid-cols-5 gap-1 text-[11px] uppercase tracking-wide text-slate-500" data-testid={`${prefix}-steps`}>
          {STEPS.map((step, stepPosition) => (
            <li key={step} className={`rounded-full px-2 py-1 text-center ${stepPosition <= stepIndex ? 'bg-slate-900 text-stone-50' : 'bg-stone-100'}`} data-testid={`${prefix}-step-${step.toLowerCase()}`}>
              {step.replace('_', ' ')}
            </li>
          ))}
        </ol>
      )}
      {parcel.deliveredAt && <p className="text-xs text-slate-500" data-testid={`${prefix}-delivered-at`}>Delivered {formatDateTime(parcel.deliveredAt)}</p>}
      {shipped && parcel.trackingNumber && <ParcelTracking trackingNumber={parcel.trackingNumber} testIdPrefix={prefix} />}
    </li>
  );
}

/** The order's parcels with their tracking, and the return request form. */
export function OrderFulfilment({ order }: { order: Order }) {
  const queryClient = useQueryClient();
  // Backends that know the fulfilment state say when no shipment exists yet; older ones
  // leave the field out, and the tracking endpoint answers 404 instead.
  const knownUnreleased = order.fulfilmentState === 'NONE';
  // A split order ships as one parcel per warehouse location; the list is empty until release.
  const parcels = useQuery({
    queryKey: ['order-parcels', order.id],
    queryFn: async () => (await warehouse.parcels(order.id)).data,
    retry: false,
    enabled: !knownUnreleased,
  });
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReturnReason>('DAMAGED');
  const [comment, setComment] = useState('');
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<number | null>(null);
  const createReturn = useMutation({
    mutationFn: () => returns.create(order.id, {
      reason,
      comment: comment.trim() || undefined,
      items: Object.entries(quantities)
        .map(([productId, quantity]) => ({ productId: Number(productId), quantity: Number(quantity) }))
        .filter((item) => item.quantity > 0),
    }),
    onSuccess: (response) => {
      setCreated(response.data.id ?? null);
      setOpen(false);
      setError(null);
      setQuantities({});
      queryClient.invalidateQueries({ queryKey: ['my-returns'] });
    },
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to request this return.')),
  });

  const parcelList = parcels.data ?? [];
  const notReleased = knownUnreleased || responseStatus(parcels.error) === 404 || (parcels.isSuccess && parcelList.length === 0);
  const selectedUnits = Object.values(quantities).reduce((sum, value) => sum + (Number(value) || 0), 0);

  return (
    <Surface variant="inset" padding="md" className="mb-6" data-testid="order-fulfilment">
      <h2 className="mb-3 text-lg font-semibold text-slate-950">Delivery</h2>
      {parcels.isLoading && <p className="text-sm text-slate-500" data-testid="order-shipment-loading">Checking shipment…</p>}
      {notReleased && <p className="text-sm text-slate-500" data-testid="order-shipment-none">Not handed to the warehouse yet. Orders are packed once payment is confirmed.</p>}
      {parcels.isError && !notReleased && <p className="text-sm text-slate-500" role="status" data-testid="order-shipment-unavailable">Shipment details are not available right now.</p>}
      {parcelList.length > 0 && (
        <div className="space-y-3" data-testid="order-shipment">
          {parcelList.length > 1 && (
            <p className="text-sm text-slate-600" data-testid="order-parcel-count">This order ships in {parcelList.length} parcels from different warehouses.</p>
          )}
          <ol className="space-y-3" data-testid="order-parcels">
            {parcelList.map((parcel, position) => (
              <OrderParcel key={parcel.id ?? position} parcel={parcel} position={position + 1} count={parcelList.length} />
            ))}
          </ol>
        </div>
      )}

      {order.status === 'DELIVERED' && (
        <div className="mt-5 border-t border-stone-200 pt-4">
          {created && (
            <p className="mb-3 text-sm text-emerald-700" role="status" data-testid="order-return-created">
              Return #{created} requested. <Link to="/returns" className="underline" data-testid="order-return-created-link">Track it in My returns</Link>
            </p>
          )}
          {!open ? (
            <Button variant="outline" onClick={() => setOpen(true)} data-testid="order-return-open">Request a return</Button>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (selectedUnits > 0) createReturn.mutate();
              }}
              data-testid="order-return-form"
            >
              <p className="text-sm text-slate-600">Choose how many units of each product you are sending back.</p>
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-3" data-testid={`order-return-line-${item.productId}`}>
                  <Label htmlFor={`order-return-qty-${item.productId}`} className="text-sm">{item.productName} <span className="text-slate-500">(bought {item.quantity})</span></Label>
                  <Input
                    id={`order-return-qty-${item.productId}`}
                    type="number"
                    min={0}
                    max={item.quantity}
                    value={quantities[item.productId] ?? '0'}
                    onChange={(event) => setQuantities({ ...quantities, [item.productId]: event.target.value })}
                    className="w-24"
                    data-testid={`order-return-qty-${item.productId}`}
                  />
                </div>
              ))}
              <div>
                <Label htmlFor="order-return-reason">Reason</Label>
                <select id="order-return-reason" value={reason} onChange={(event) => setReason(event.target.value as ReturnReason)} className={`mt-2 ${selectClassName}`} data-testid="order-return-reason">
                  {REASONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="order-return-comment">Comment (optional)</Label>
                <Textarea id="order-return-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} className="mt-2" data-testid="order-return-comment" />
              </div>
              {error && <p className="text-sm text-red-700" role="alert" data-testid="order-return-error">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={selectedUnits === 0 || createReturn.isPending} data-testid="order-return-submit">Submit return</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="order-return-cancel">Cancel</Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Surface>
  );
}
