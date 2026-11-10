import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tracking as trackingApi, warehouse } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { serverMessage } from '../../lib/requestErrors';
import { validateTracking, validateWeight } from '../../lib/commerceValidation';
import { CARRIER_FORMATS, type Carrier, type Shipment, type ShipmentStatus } from '../../types/commerce';
import { formatDateTime, selectClassName } from '../../lib/commerceFormat';
import { publicTrackingQueryKey, trackingStatusLabel } from '../../lib/tracking';
import { PageHeader, StatusBadge } from '../commerce/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';

const FILTERS: (ShipmentStatus | '')[] = ['', 'AWAITING_PICK', 'PICKED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

/** Fast-forwards a parcel handed to the simulated carrier by one scan. */
function CarrierAdvance({ shipmentId, trackingNumber, onAdvanced }: { shipmentId: number; trackingNumber: string; onAdvanced: (message: string) => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  // ShipmentDto does not say whether the carrier is simulated; the public tracking view does.
  const carrier = useQuery({
    queryKey: publicTrackingQueryKey(trackingNumber),
    queryFn: async () => (await trackingApi.byNumber(trackingNumber)).data,
    retry: false,
  });
  const advance = useMutation({
    mutationFn: () => trackingApi.advance(shipmentId),
    onSuccess: (response) => {
      setError(null);
      queryClient.setQueryData(publicTrackingQueryKey(trackingNumber), response.data);
      onAdvanced(`Shipment #${shipmentId} carrier status: ${trackingStatusLabel(response.data.currentStatus)}`);
    },
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to advance the carrier.')),
  });
  if (!carrier.data?.simulated) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid={`warehouse-carrier-${shipmentId}-simulated`}>
      <span className="text-sm text-slate-600" data-testid={`warehouse-carrier-status-${shipmentId}`}>Simulated carrier · {trackingStatusLabel(carrier.data.currentStatus)}</span>
      <Button variant="outline" onClick={() => advance.mutate()} disabled={advance.isPending} data-testid={`warehouse-advance-${shipmentId}`}>Advance carrier</Button>
      {error && <p className="w-full text-sm text-red-700" role="alert" data-testid={`warehouse-advance-error-${shipmentId}`}>{error}</p>}
    </div>
  );
}

function ShipmentActions({ shipment, onDone, onAdvanced }: { shipment: Shipment; onDone: (updated: Shipment) => void; onAdvanced: (message: string) => void }) {
  const id = shipment.id as number;
  const [weight, setWeight] = useState('');
  const [carrier, setCarrier] = useState<Carrier>('DHL');
  const [tracking, setTracking] = useState('');
  // The simulated carrier generates the tracking number and moves the parcel on its own.
  const [simulated, setSimulated] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useMutation({
    mutationFn: (action: () => Promise<{ data: Shipment }>) => action(),
    onSuccess: (response) => {
      setError(null);
      setTouched(false);
      onDone(response.data);
    },
    onError: (mutationError) => setError(serverMessage(mutationError, 'This transition failed.')),
  });
  const weightError = validateWeight(weight);
  const trackingError = simulated ? null : validateTracking(carrier, tracking);

  return (
    <div className="space-y-3" data-testid={`warehouse-actions-${id}`}>
      {shipment.status === 'AWAITING_PICK' && (
        <Button onClick={() => run.mutate(() => warehouse.pick(id))} disabled={run.isPending} data-testid={`warehouse-pick-${id}`}>Mark picked</Button>
      )}
      {shipment.status === 'PICKED' && (
        <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); setTouched(true); if (!weightError) run.mutate(() => warehouse.pack(id, Number(weight))); }} data-testid={`warehouse-pack-form-${id}`}>
          <div>
            <Label htmlFor={`warehouse-weight-${id}`}>Weight (kg)</Label>
            <Input id={`warehouse-weight-${id}`} value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="decimal" placeholder="1.25" className="mt-1 w-28" data-testid={`warehouse-weight-${id}`} />
          </div>
          <Button type="submit" disabled={run.isPending} data-testid={`warehouse-pack-${id}`}>Mark packed</Button>
          {touched && weightError && <p className="w-full text-xs text-red-700" role="alert" data-testid={`warehouse-weight-error-${id}`}>{weightError}</p>}
        </form>
      )}
      {shipment.status === 'PACKED' && (
        <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); setTouched(true); if (!trackingError) run.mutate(() => (simulated ? warehouse.ship(id, carrier) : warehouse.ship(id, carrier, tracking.trim()))); }} data-testid={`warehouse-ship-form-${id}`}>
          <div>
            <Label htmlFor={`warehouse-carrier-${id}`}>Carrier</Label>
            <select id={`warehouse-carrier-${id}`} value={carrier} onChange={(event) => setCarrier(event.target.value as Carrier)} className={`mt-1 w-32 ${selectClassName}`} data-testid={`warehouse-carrier-${id}`}>
              {(Object.keys(CARRIER_FORMATS) as Carrier[]).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          {!simulated && (
            <div className="flex-1">
              <Label htmlFor={`warehouse-tracking-${id}`}>Tracking number</Label>
              <Input id={`warehouse-tracking-${id}`} value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder={CARRIER_FORMATS[carrier].hint} className="mt-1" data-testid={`warehouse-tracking-${id}`} />
            </div>
          )}
          <label className="flex w-full items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={simulated} onChange={(event) => setSimulated(event.target.checked)} data-testid={`warehouse-simulated-${id}`} />
            Simulated carrier (auto tracking number)
          </label>
          <Button type="submit" disabled={run.isPending} data-testid={`warehouse-ship-${id}`}>Hand to carrier</Button>
          {touched && trackingError && <p className="w-full text-xs text-red-700" role="alert" data-testid={`warehouse-tracking-error-${id}`}>{trackingError}</p>}
        </form>
      )}
      {shipment.status === 'SHIPPED' && (
        <Button onClick={() => run.mutate(() => warehouse.deliver(id))} disabled={run.isPending} data-testid={`warehouse-deliver-${id}`}>Confirm delivery</Button>
      )}
      {shipment.status === 'SHIPPED' && shipment.trackingNumber && (
        <CarrierAdvance shipmentId={id} trackingNumber={shipment.trackingNumber} onAdvanced={onAdvanced} />
      )}
      {(shipment.status === 'AWAITING_PICK' || shipment.status === 'PICKED') && (
        <Button
          variant="outline"
          onClick={() => { if (window.confirm(`Cancel shipment #${id}? The order is cancelled and stock is restored.`)) run.mutate(() => warehouse.cancel(id)); }}
          disabled={run.isPending}
          data-testid={`warehouse-cancel-${id}`}
        >
          Cancel shipment
        </Button>
      )}
      {error && <p className="text-sm text-red-700" role="alert" data-testid={`warehouse-error-${id}`}>{error}</p>}
    </div>
  );
}

function PickList({ shipmentId }: { shipmentId: number }) {
  const { data, isLoading } = useQuery({ queryKey: ['pick-list', shipmentId], queryFn: () => warehouse.pickList(shipmentId) });
  if (isLoading) return <p className="text-sm text-slate-500" data-testid="warehouse-pick-list-loading">Loading pick list…</p>;
  const list = data?.data;
  return (
    <div data-testid="warehouse-pick-list">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pick list · {list?.totalUnits} units</p>
      <ul className="mt-2 space-y-1 text-sm">
        {(list?.items ?? []).map((item) => (
          <li key={item.productId} className="flex justify-between gap-3" data-testid={`warehouse-pick-item-${item.productId}`}>
            <span><span className="text-slate-500">{item.category}</span> · {item.productName}</span>
            <span className="font-semibold">× {item.quantity}</span>
          </li>
        ))}
      </ul>
      {list?.shippingAddress && (
        <p className="mt-3 text-xs text-slate-500" data-testid="warehouse-pick-address">
          Ship to {list.shippingAddress.street}, {list.shippingAddress.city} {list.shippingAddress.zipCode}, {list.shippingAddress.country}
        </p>
      )}
    </div>
  );
}

export function WarehouseBoard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ShipmentStatus | ''>('AWAITING_PICK');
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const queue = useQuery({ queryKey: ['warehouse-queue'], queryFn: () => warehouse.queue() });
  const shipments = useQuery({ queryKey: ['warehouse-shipments', filter], queryFn: () => warehouse.shipments(filter || undefined) });
  const refresh = (message: string) => {
    setNotice(message);
    queryClient.invalidateQueries({ queryKey: ['warehouse-queue'] });
    queryClient.invalidateQueries({ queryKey: ['warehouse-shipments'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };
  const release = useMutation({
    mutationFn: (orderId: number) => warehouse.create(orderId),
    onSuccess: (response) => {
      setReleaseError(null);
      refresh(`Order #${response.data.orderId} released as shipment #${response.data.id}`);
    },
    onError: (error) => setReleaseError(serverMessage(error, 'Unable to release this order.')),
  });
  const queued = queue.data?.data.content ?? [];
  const rows = shipments.data?.data.content ?? [];
  const selectedShipment = rows.find((row) => row.id === selected);

  return (
    <div className="space-y-6 pb-10" data-testid="warehouse-board">
      <PageHeader eyebrow="Fulfilment" title="Warehouse" description="Release paid orders, then pick, pack and hand parcels to the carrier." />
      {notice && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status" data-testid="warehouse-notice">{notice}</p>}

      <Surface variant="default" padding="md" data-testid="warehouse-queue">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Ready to release <span className="text-sm font-normal text-slate-500" data-testid="warehouse-queue-count">({queue.data?.data.totalElements ?? 0})</span></h2>
          <Button variant="outline" size="sm" onClick={() => queue.refetch()} data-testid="warehouse-queue-refresh">Refresh</Button>
        </div>
        {queue.isError && <p className="mt-3 text-sm text-red-700" role="alert" data-testid="warehouse-queue-error">Unable to load the queue.</p>}
        {releaseError && <p className="mt-3 text-sm text-red-700" role="alert" data-testid="warehouse-release-error">{releaseError}</p>}
        {!queue.isLoading && queued.length === 0 && <p className="mt-3 text-sm text-slate-500" data-testid="warehouse-queue-empty">No paid orders are waiting.</p>}
        <ul className="mt-3 divide-y divide-stone-100">
          {queued.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3" data-testid={`warehouse-queue-order-${order.id}`}>
              <div className="text-sm">
                <span className="font-medium text-slate-950">Order #{order.id}</span>
                <span className="ml-2 text-slate-500">{order.username} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} units · {formatPrice(order.totalAmount)} · placed {formatDateTime(order.createdAt)}</span>
              </div>
              <Button size="sm" onClick={() => release.mutate(order.id)} disabled={release.isPending} data-testid={`warehouse-release-${order.id}`}>Release to warehouse</Button>
            </li>
          ))}
        </ul>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Surface variant="default" padding="none" className="overflow-hidden" data-testid="warehouse-shipments">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 p-4">
            <h2 className="text-lg font-semibold text-slate-950">Shipments</h2>
            <div>
              <Label htmlFor="warehouse-filter" className="sr-only">Status</Label>
              <select id="warehouse-filter" value={filter} onChange={(event) => { setFilter(event.target.value as ShipmentStatus | ''); setSelected(null); }} className={`w-48 ${selectClassName}`} data-testid="warehouse-filter">
                {FILTERS.map((status) => <option key={status || 'ALL'} value={status}>{status ? status.replace('_', ' ') : 'All statuses'}</option>)}
              </select>
            </div>
          </div>
          {shipments.isError && <p className="p-6 text-sm text-red-700" role="alert" data-testid="warehouse-shipments-error">Unable to load shipments.</p>}
          {!shipments.isLoading && rows.length === 0 && <p className="p-6 text-sm text-slate-500" data-testid="warehouse-shipments-empty">No shipments in this status.</p>}
          <ul className="divide-y divide-stone-100">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-stone-50 ${selected === row.id ? 'bg-sky-50/60' : ''}`}
                  onClick={() => setSelected(row.id as number)}
                  data-testid={`warehouse-shipment-${row.id}`}
                >
                  <span><span className="font-medium text-slate-950">#{row.id}</span> <span className="text-slate-500">order #{row.orderId} · {row.totalUnits} units · {row.username}</span></span>
                  <StatusBadge status={row.status} testId={`warehouse-shipment-status-${row.id}`} />
                </button>
              </li>
            ))}
          </ul>
        </Surface>

        <Surface variant="default" padding="lg" data-testid="warehouse-inspector">
          {!selectedShipment ? (
            <p className="text-sm text-slate-500" data-testid="warehouse-no-selection">Select a shipment to see its pick list and next step.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-950" data-testid="warehouse-selected-title">Shipment #{selectedShipment.id}</h2>
                <StatusBadge status={selectedShipment.status} testId="warehouse-selected-status" />
              </div>
              <PickList shipmentId={selectedShipment.id as number} />
              {selectedShipment.trackingNumber && <p className="text-sm text-slate-700" data-testid="warehouse-selected-tracking">{selectedShipment.carrier} · {selectedShipment.trackingNumber}</p>}
              {selectedShipment.weightKg != null && <p className="text-sm text-slate-700" data-testid="warehouse-selected-weight">{selectedShipment.weightKg} kg</p>}
              <ShipmentActions
                key={`${selectedShipment.id}-${selectedShipment.status}`}
                shipment={selectedShipment}
                onDone={(updated) => {
                  setFilter(updated.status ?? '');
                  refresh(`Shipment #${updated.id} is now ${updated.status?.replace('_', ' ')}`);
                }}
                onAdvanced={refresh}
              />
              <p className="text-xs text-slate-500">Last change by {selectedShipment.lastActor} · {formatDateTime(selectedShipment.updatedAt)}</p>
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}
