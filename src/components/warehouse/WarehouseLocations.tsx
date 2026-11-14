import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { warehouse } from '../../lib/api';
import { serverMessage } from '../../lib/requestErrors';
import type { WarehouseLocation } from '../../types/commerce';
import { PageHeader, StatusBadge } from '../commerce/shared';
import { Button } from '../ui/button';
import { Surface } from '../ui/surface';

const WAREHOUSE_LOCATIONS_QUERY_KEY = ['warehouse-locations'] as const;
const RECONCILIATION_QUERY_KEY = ['warehouse-reconciliation'] as const;

const categories = (list?: string[]) => {
  if (!list || list.length === 0) return '—';
  return list.map((category) => (category === '*' ? 'every other category' : category)).join(', ');
};

function LocationRow({ location }: { location: WarehouseLocation }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const code = location.code as string;
  const toggle = useMutation({
    mutationFn: () => warehouse.setLocationActive(code, !location.active),
    onSuccess: (response) => {
      setError(null);
      queryClient.setQueryData<WarehouseLocation[]>(WAREHOUSE_LOCATIONS_QUERY_KEY, (current) =>
        current?.map((entry) => (entry.code === code ? response.data : entry)));
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_LOCATIONS_QUERY_KEY });
    },
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to change this location.')),
  });

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between" data-testid={`warehouse-location-${code}`}>
      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-medium text-slate-950">
          <span data-testid={`warehouse-location-name-${code}`}>{location.name}</span>
          <span className="ml-2 text-slate-500">{code} · {location.city} · priority {location.priority}</span>
        </p>
        <p className="text-slate-600" data-testid={`warehouse-location-primary-${code}`}>Primary for {categories(location.primaryCategories)}</p>
        <p className="text-slate-600" data-testid={`warehouse-location-backup-${code}`}>Backup for {categories(location.backupCategories)}</p>
        {error && <p className="text-red-700" role="alert" data-testid={`warehouse-location-error-${code}`}>{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <StatusBadge status={location.active ? 'ACTIVE' : 'INACTIVE'} testId={`warehouse-location-status-${code}`} />
        <Button
          variant="outline"
          size="sm"
          role="switch"
          aria-checked={location.active}
          aria-label={`${location.name} takes new parcels`}
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
          data-testid={`warehouse-location-toggle-${code}`}
        >
          {location.active ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </li>
  );
}

function Reconciliation() {
  const query = useQuery({
    queryKey: RECONCILIATION_QUERY_KEY,
    queryFn: async () => (await warehouse.reconciliation()).data,
    retry: false,
  });
  const entries = query.data ?? [];

  return (
    <Surface variant="default" padding="md" data-testid="warehouse-reconciliation">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Reconciliation</h2>
          <p className="text-sm text-slate-600">Orders whose parcels disagree with the fulfilment state the backend shows.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching} data-testid="warehouse-reconciliation-refresh">Refresh</Button>
      </div>
      {query.isLoading && <p className="mt-3 text-sm text-slate-500" data-testid="warehouse-reconciliation-loading">Comparing with the backend…</p>}
      {query.isError && <p className="mt-3 text-sm text-red-700" role="alert" data-testid="warehouse-reconciliation-error">{serverMessage(query.error, 'Unable to compare with the backend.')}</p>}
      {query.isSuccess && entries.length === 0 && (
        <p className="mt-3 text-sm text-emerald-800" role="status" data-testid="warehouse-reconciliation-empty">Every order agrees with the backend.</p>
      )}
      {entries.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm" data-testid="warehouse-reconciliation-table">
            <thead className="bg-stone-50/80 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2">Order</th>
                <th scope="col" className="px-3 py-2">Backend</th>
                <th scope="col" className="px-3 py-2">Expected</th>
                <th scope="col" className="px-3 py-2">Last mirrored</th>
                <th scope="col" className="px-3 py-2">Parcels</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {entries.map((entry) => (
                <tr key={entry.orderId} data-testid={`warehouse-reconciliation-${entry.orderId}`}>
                  <td className="px-3 py-2">
                    <Link to={`/orders/${entry.orderId}`} className="text-sky-700 hover:underline" data-testid={`warehouse-reconciliation-order-${entry.orderId}`}>#{entry.orderId}</Link>
                  </td>
                  <td className="px-3 py-2" data-testid={`warehouse-reconciliation-backend-${entry.orderId}`}>{entry.backendState ?? 'unknown'}</td>
                  <td className="px-3 py-2 font-medium" data-testid={`warehouse-reconciliation-expected-${entry.orderId}`}>{entry.aggregateState}</td>
                  <td className="px-3 py-2 text-slate-600">{entry.lastMirroredState ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600" data-testid={`warehouse-reconciliation-parcels-${entry.orderId}`}>
                    {(entry.parcels ?? []).map((parcel) => `#${parcel.shipmentId} ${parcel.locationCode} ${parcel.status}`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Surface>
  );
}

/** Warehouse locations with their activation switch, and the fulfilment reconciliation report. */
export function WarehouseLocations() {
  const locations = useQuery({
    queryKey: WAREHOUSE_LOCATIONS_QUERY_KEY,
    queryFn: async () => (await warehouse.locations()).data,
  });
  const list = locations.data ?? [];

  return (
    <div className="space-y-6 pb-10" data-testid="warehouse-locations-page">
      <PageHeader
        eyebrow="Fulfilment"
        title="Warehouse locations"
        description="Each order line ships from the highest-priority active location that stocks its category. An inactive location takes no new parcels."
        aside={<Link to="/warehouse" className="text-sm text-sky-700 hover:underline" data-testid="warehouse-locations-board-link">← Warehouse board</Link>}
      />
      <Surface variant="default" padding="md" data-testid="warehouse-locations">
        <h2 className="text-lg font-semibold text-slate-950">Locations</h2>
        {locations.isLoading && <p className="mt-3 text-sm text-slate-500" data-testid="warehouse-locations-loading">Loading locations…</p>}
        {locations.isError && <p className="mt-3 text-sm text-red-700" role="alert" data-testid="warehouse-locations-error">Unable to load the locations.</p>}
        <ul className="divide-y divide-stone-100">
          {list.map((location) => <LocationRow key={location.code} location={location} />)}
        </ul>
      </Surface>
      <Reconciliation />
    </div>
  );
}
