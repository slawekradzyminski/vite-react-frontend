import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import axios from 'axios';
import { inventory } from '../../lib/api';
import type { InventoryAdjustmentRequest, InventoryItem, StockStatus } from '../../types/inventory';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';
import { Textarea } from '../ui/textarea';
import { AdminSectionNav } from './AdminSectionNav';

const PAGE_SIZE = 20;
const DEFAULT_THRESHOLD = 5;

const statusLabel: Record<StockStatus, string> = {
  IN_STOCK: 'In stock',
  LOW_STOCK: 'Low stock',
  OUT_OF_STOCK: 'Out of stock',
};

const statusVariant: Record<StockStatus, 'success' | 'warning' | 'error'> = {
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'error',
};

function isConflict(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 409;
}

export function AdminInventory() {
  const { productId } = useParams<{ productId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const parsedProductId = productId === undefined ? null : Number(productId);
  const selectedId = parsedProductId !== null
    && Number.isInteger(parsedProductId)
    && parsedProductId > 0
    ? parsedProductId
    : null;
  const hasInvalidSelection = productId !== undefined && selectedId === null;
  const previousSelectedId = useRef(selectedId);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<StockStatus | ''>('');
  const [thresholdInput, setThresholdInput] = useState(String(DEFAULT_THRESHOLD));
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const parsedThreshold = Number(thresholdInput);
  const threshold = Number.isInteger(parsedThreshold) && parsedThreshold >= 1
    ? parsedThreshold
    : 1;

  const listQuery = useQuery({
    queryKey: ['inventory', { page, search, category, status, threshold }],
    queryFn: () => inventory.list({ page, size: PAGE_SIZE, search: search || undefined, category: category || undefined, status: status || undefined, lowStockThreshold: threshold }),
  });
  const detailQuery = useQuery({
    queryKey: ['inventory-detail', selectedId, threshold],
    queryFn: () => inventory.get(selectedId as number, threshold),
    enabled: selectedId !== null,
  });
  const movementsQuery = useQuery({
    queryKey: ['inventory-movements', selectedId],
    queryFn: () => inventory.movements(selectedId as number),
    enabled: selectedId !== null,
  });
  const adjustmentMutation = useMutation({
    mutationFn: (data: InventoryAdjustmentRequest) => inventory.adjust(selectedId as number, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-detail', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDelta('');
      setReason('');
      setAdjustmentError(null);
      setRequestId(crypto.randomUUID());
    },
    onError: (error) => {
      setAdjustmentError(isConflict(error)
        ? 'This adjustment conflicts with the current inventory state. Review the quantity and retry the same adjustment if it is still valid.'
        : 'Unable to apply this adjustment. Check the values and try again.');
    },
  });

  useEffect(() => {
    setPage(0);
  }, [search, category, status, threshold]);

  useEffect(() => {
    if (previousSelectedId.current !== selectedId) {
      previousSelectedId.current = selectedId;
      setDelta('');
      setReason('');
      setAdjustmentError(null);
      setRequestId(crypto.randomUUID());
    }
  }, [selectedId]);

  const selected = detailQuery.data?.data;
  const items = listQuery.data?.data.content ?? [];
  const totalPages = listQuery.data?.data.totalPages ?? 0;
  const parsedDelta = Number(delta);
  const reasonValid = reason.trim().length > 0 && reason.trim().length <= 500;
  const deltaValid = Number.isInteger(parsedDelta) && parsedDelta !== 0;
  const canSubmit = selectedId !== null && deltaValid && reasonValid && !adjustmentMutation.isPending;

  const selectItem = (item: InventoryItem) => navigate(`/admin/inventory/${item.productId}`);
  const submitAdjustment = () => {
    if (!canSubmit) return;
    adjustmentMutation.mutate({ delta: parsedDelta, reason: reason.trim(), requestId });
  };

  return (
    <div className="space-y-6 pb-10" data-testid="admin-inventory">
      <AdminSectionNav />
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Inventory</h1>
          <p className="mt-2 text-sm text-slate-600">Review availability and record stock movements.</p>
        </div>
        <p className="text-sm text-slate-500" data-testid="inventory-result-count">{listQuery.data?.data.totalElements ?? 0} products</p>
      </div>

      <Surface variant="default" padding="md" data-testid="inventory-filters">
        <div className="grid gap-3 md:grid-cols-4">
          <div><Label htmlFor="inventory-search">Search</Label><Input id="inventory-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Product name" className="mt-2" /></div>
          <div><Label htmlFor="inventory-category">Category</Label><Input id="inventory-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Exact category" className="mt-2" /></div>
          <div><Label htmlFor="inventory-status">Stock status</Label><select id="inventory-status" value={status} onChange={(event) => setStatus(event.target.value as StockStatus | '')} className="mt-2 h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm"><option value="">All statuses</option>{Object.entries(statusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <div><Label htmlFor="inventory-threshold">Low-stock threshold</Label><Input id="inventory-threshold" type="number" min="1" step="1" value={thresholdInput} onChange={(event) => setThresholdInput(event.target.value)} onBlur={() => setThresholdInput(String(threshold))} className="mt-2" /></div>
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Surface variant="default" padding="none" className="overflow-hidden" data-testid="inventory-table-surface">
          {listQuery.isLoading && <p className="p-8 text-center text-sm text-slate-500" data-testid="inventory-list-loading">Loading inventory…</p>}
          {listQuery.isError && <p className="p-8 text-center text-sm text-red-700" role="alert" data-testid="inventory-list-error">Unable to load inventory. Try again shortly.</p>}
          {!listQuery.isLoading && !listQuery.isError && (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.14em] text-slate-500"><tr><th className="px-4 py-4 sm:px-5">Product</th><th className="hidden px-5 py-4 sm:table-cell">Category</th><th className="px-4 py-4 sm:px-5">Available</th><th className="px-4 py-4 sm:px-5">Status</th></tr></thead><tbody>{items.map((item) => <tr key={item.productId} className={`cursor-pointer border-b border-stone-100 transition hover:bg-stone-50 ${selectedId === item.productId ? 'bg-sky-50/60' : ''}`} onClick={() => selectItem(item)} data-testid={`inventory-row-${item.productId}`}><td className="px-4 py-4 font-medium text-slate-900 sm:px-5">{item.name}</td><td className="hidden px-5 py-4 text-slate-600 sm:table-cell">{item.category}</td><td className="px-4 py-4 font-semibold text-slate-900 sm:px-5">{item.availableQuantity}</td><td className="px-4 py-4 sm:px-5"><Badge variant={statusVariant[item.stockStatus]}>{statusLabel[item.stockStatus]}</Badge></td></tr>)}</tbody></table></div>
          )}
          {!listQuery.isLoading && !listQuery.isError && items.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No inventory matches these filters.</p>}
          <div className="flex items-center justify-between border-t border-stone-200 px-5 py-4"><span className="text-sm text-slate-500">Page {totalPages ? page + 1 : 0} of {totalPages}</span><div className="flex gap-2"><Button variant="outline" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>Previous</Button><Button variant="outline" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={totalPages === 0 || page >= totalPages - 1}>Next</Button></div></div>
        </Surface>

        <Surface variant="default" padding="lg" data-testid="inventory-inspector">
          {hasInvalidSelection ? <div className="flex min-h-80 flex-col justify-center text-center" role="alert" data-testid="inventory-invalid-selection"><p className="text-lg font-semibold text-slate-950">Invalid product selection</p><p className="mt-2 text-sm leading-6 text-slate-500">Choose a product from the inventory list.</p></div> : selectedId === null ? <div className="flex min-h-80 flex-col justify-center text-center"><p className="text-lg font-semibold text-slate-950">Select a product</p><p className="mt-2 text-sm leading-6 text-slate-500">Choose an inventory row to inspect stock and record an adjustment.</p></div> : detailQuery.isLoading ? <div className="flex min-h-80 items-center justify-center text-sm text-slate-500" data-testid="inventory-detail-loading">Loading product inventory…</div> : detailQuery.isError || !selected ? <div className="flex min-h-80 flex-col justify-center text-center" role="alert" data-testid="inventory-detail-error"><p className="text-lg font-semibold text-slate-950">Unable to load this product</p><p className="mt-2 text-sm leading-6 text-slate-500">It may no longer exist or the inventory service may be unavailable.</p></div> : (
            <div className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected product</p><h2 className="mt-2 text-2xl font-semibold text-slate-950">{selected.name}</h2><div className="mt-3 flex items-center gap-3"><span className="text-3xl font-semibold text-slate-950">{selected.availableQuantity}</span><Badge variant={statusVariant[selected.stockStatus]}>{statusLabel[selected.stockStatus]}</Badge></div></div>
              <div className="border-t border-stone-200 pt-5"><h3 className="text-sm font-semibold text-slate-950">Adjust stock</h3><p className="mt-1 text-xs text-slate-500">Use a signed integer, for example +10 or -2.</p><div className="mt-4 space-y-3"><div><Label htmlFor="inventory-delta">Quantity change</Label><Input id="inventory-delta" value={delta} onChange={(event) => setDelta(event.target.value)} inputMode="numeric" placeholder="+10" className="mt-2" /></div><div><Label htmlFor="inventory-reason">Reason</Label><Textarea id="inventory-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Why is stock changing?" className="mt-2" /></div>{adjustmentError && <p className="text-sm text-red-700" role="alert" data-testid="inventory-adjustment-error">{adjustmentError}</p>}<Button onClick={submitAdjustment} disabled={!canSubmit} className="w-full">{adjustmentMutation.isPending ? 'Applying…' : 'Apply adjustment'}</Button></div></div>
              <div className="border-t border-stone-200 pt-5"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-950">Movement history</h3><button className="text-xs text-sky-700 hover:underline disabled:text-slate-400" type="button" onClick={() => movementsQuery.refetch()} disabled={movementsQuery.isFetching}>Refresh</button></div><div className="mt-3 space-y-3">{movementsQuery.isLoading && <p className="text-sm text-slate-500">Loading movements…</p>}{movementsQuery.isError && <p className="text-sm text-red-700" role="alert">Unable to load movement history.</p>}{(movementsQuery.data?.data.content ?? []).map((movement) => <div key={movement.id} className="border-b border-stone-100 pb-3 text-sm last:border-0"><div className="flex items-center justify-between gap-3"><span className="font-medium text-slate-900">{movement.type.replace('_', ' ')}</span><span className={movement.delta > 0 ? 'text-emerald-700' : 'text-red-700'}>{movement.delta > 0 ? '+' : ''}{movement.delta}</span></div><p className="mt-1 text-xs text-slate-500">{movement.reason} · {new Date(movement.createdAt).toLocaleString()}</p></div>)}{!movementsQuery.isLoading && !movementsQuery.isError && (movementsQuery.data?.data.content ?? []).length === 0 && <p className="text-sm text-slate-500">No movements recorded.</p>}</div></div>
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}
