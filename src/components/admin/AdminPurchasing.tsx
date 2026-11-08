import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { products, purchasing } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { serverMessage } from '../../lib/requestErrors';
import type { PurchaseOrder } from '../../types/commerce';
import { formatDateTime, selectClassName } from '../../lib/commerceFormat';
import { PageHeader, StatusBadge } from '../commerce/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';
import { AdminSectionNav } from './AdminSectionNav';

interface DraftLine { productId: string; quantity: string; unitCost: string }

function ReceiveForm({ order, onDone }: { order: PurchaseOrder; onDone: () => void }) {
  const id = order.id as number;
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const receive = useMutation({
    mutationFn: () => purchasing.receive(id, {
      requestId,
      lines: Object.entries(quantities)
        .map(([productId, quantity]) => ({ productId: Number(productId), quantity: Number(quantity) }))
        .filter((line) => line.quantity > 0),
    }),
    onSuccess: () => { setQuantities({}); setRequestId(crypto.randomUUID()); setError(null); onDone(); },
    // A failed receipt keeps its requestId so retrying cannot book the goods twice.
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to record this receipt.')),
  });
  const total = Object.values(quantities).reduce((sum, value) => sum + (Number(value) || 0), 0);
  return (
    <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); if (total > 0) receive.mutate(); }} data-testid={`po-receive-form-${id}`}>
      {(order.lines ?? []).filter((line) => (line.outstandingQuantity ?? 0) > 0).map((line) => (
        <div key={line.productId} className="flex items-center justify-between gap-3 text-sm">
          <Label htmlFor={`po-receive-${id}-${line.productId}`}>{line.productName} <span className="text-slate-500">({line.outstandingQuantity} outstanding)</span></Label>
          <Input id={`po-receive-${id}-${line.productId}`} type="number" min={0} value={quantities[line.productId as number] ?? ''} onChange={(event) => setQuantities({ ...quantities, [line.productId as number]: event.target.value })} className="w-24" data-testid={`po-receive-qty-${id}-${line.productId}`} />
        </div>
      ))}
      {error && <p className="text-sm text-red-700" role="alert" data-testid={`po-receive-error-${id}`}>{error}</p>}
      <Button type="submit" size="sm" disabled={total === 0 || receive.isPending} data-testid={`po-receive-submit-${id}`}>Book receipt</Button>
    </form>
  );
}

export function AdminPurchasing() {
  const queryClient = useQueryClient();
  const [supplier, setSupplier] = useState({ name: '', email: '', leadTimeDays: '7' });
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [draftSupplier, setDraftSupplier] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([{ productId: '', quantity: '', unitCost: '' }]);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState('5');
  const suppliers = useQuery({ queryKey: ['suppliers'], queryFn: purchasing.suppliers });
  const catalog = useQuery({ queryKey: ['products'], queryFn: products.getAllProducts });
  const orders = useQuery({ queryKey: ['purchase-orders'], queryFn: () => purchasing.list() });
  const parsedThreshold = Math.max(1, Number.parseInt(threshold, 10) || 1);
  const suggestions = useQuery({ queryKey: ['reorder-suggestions', parsedThreshold], queryFn: () => purchasing.reorderSuggestions(parsedThreshold) });
  const refresh = () => {
    ['purchase-orders', 'reorder-suggestions', 'inventory', 'products'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const createSupplier = useMutation({
    mutationFn: () => purchasing.createSupplier({ name: supplier.name.trim(), email: supplier.email.trim(), leadTimeDays: Number(supplier.leadTimeDays) }),
    onSuccess: () => { setSupplier({ name: '', email: '', leadTimeDays: '7' }); setSupplierError(null); queryClient.invalidateQueries({ queryKey: ['suppliers'] }); },
    onError: (error) => setSupplierError(serverMessage(error, 'Unable to create the supplier.')),
  });
  const createDraft = useMutation({
    mutationFn: () => purchasing.create({
      supplierId: Number(draftSupplier),
      note: draftNote.trim() || undefined,
      lines: lines.filter((line) => line.productId).map((line) => ({ productId: Number(line.productId), quantity: Number(line.quantity), unitCost: Number(line.unitCost) })),
    }),
    onSuccess: () => { setLines([{ productId: '', quantity: '', unitCost: '' }]); setDraftNote(''); setDraftError(null); refresh(); },
    onError: (error) => setDraftError(serverMessage(error, 'Unable to create the purchase order.')),
  });
  const transition = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: () => { setActionError(null); refresh(); },
    onError: (error) => setActionError(serverMessage(error, 'This action failed.')),
  });

  const addSuggestion = (productId: number, quantity: number) => {
    setLines((current) => [...current.filter((line) => line.productId), { productId: String(productId), quantity: String(quantity), unitCost: '' }]);
  };
  const draftValid = draftSupplier !== '' && lines.every((line) => !line.productId || (Number(line.quantity) >= 1 && Number(line.unitCost) > 0));

  return (
    <div className="space-y-6 pb-10" data-testid="admin-purchasing">
      <AdminSectionNav />
      <PageHeader eyebrow="Operations" title="Purchasing" description="Reorder low stock from suppliers and book deliveries into inventory." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Surface variant="default" padding="lg" data-testid="reorder-suggestions">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Reorder suggestions</h2>
            <div><Label htmlFor="reorder-threshold">Threshold</Label><Input id="reorder-threshold" type="number" min={1} value={threshold} onChange={(event) => setThreshold(event.target.value)} className="mt-1 w-24" data-testid="reorder-threshold" /></div>
          </div>
          {!suggestions.isLoading && (suggestions.data?.data ?? []).length === 0 && <p className="mt-3 text-sm text-slate-500" data-testid="reorder-empty">Stock and incoming deliveries cover every product.</p>}
          <ul className="mt-3 divide-y divide-stone-100 text-sm">
            {(suggestions.data?.data ?? []).map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-3 py-2" data-testid={`reorder-${item.productId}`}>
                <span>{item.productName} <span className="text-slate-500">· {item.stockQuantity} in stock · {item.incomingQuantity} incoming</span></span>
                <Button size="sm" variant="outline" onClick={() => addSuggestion(item.productId as number, item.suggestedQuantity as number)} data-testid={`reorder-add-${item.productId}`}>Add {item.suggestedQuantity}</Button>
              </li>
            ))}
          </ul>
        </Surface>

        <Surface variant="default" padding="lg" data-testid="suppliers">
          <h2 className="text-lg font-semibold text-slate-950">Suppliers</h2>
          <ul className="mt-3 space-y-1 text-sm" data-testid="suppliers-list">
            {(suppliers.data?.data ?? []).map((item) => <li key={item.id} data-testid={`supplier-${item.id}`}>{item.name} <span className="text-slate-500">· {item.email} · {item.leadTimeDays} days</span></li>)}
          </ul>
          <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end" onSubmit={(event) => { event.preventDefault(); createSupplier.mutate(); }} data-testid="supplier-form">
            <div><Label htmlFor="supplier-name">Name</Label><Input id="supplier-name" value={supplier.name} onChange={(event) => setSupplier({ ...supplier, name: event.target.value })} className="mt-1" data-testid="supplier-name" /></div>
            <div><Label htmlFor="supplier-email">Email</Label><Input id="supplier-email" type="email" value={supplier.email} onChange={(event) => setSupplier({ ...supplier, email: event.target.value })} className="mt-1" data-testid="supplier-email" /></div>
            <div><Label htmlFor="supplier-lead">Lead days</Label><Input id="supplier-lead" type="number" min={0} max={365} value={supplier.leadTimeDays} onChange={(event) => setSupplier({ ...supplier, leadTimeDays: event.target.value })} className="mt-1" data-testid="supplier-lead-time" /></div>
            <Button type="submit" disabled={createSupplier.isPending || !supplier.name.trim()} data-testid="supplier-create">Add</Button>
          </form>
          {supplierError && <p className="mt-2 text-sm text-red-700" role="alert" data-testid="supplier-error">{supplierError}</p>}
        </Surface>
      </div>

      <Surface variant="default" padding="lg" data-testid="po-draft">
        <h2 className="text-lg font-semibold text-slate-950">New purchase order</h2>
        <form className="mt-3 space-y-3" onSubmit={(event) => { event.preventDefault(); if (draftValid) createDraft.mutate(); }} data-testid="po-draft-form">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="po-supplier">Supplier</Label><select id="po-supplier" value={draftSupplier} onChange={(event) => setDraftSupplier(event.target.value)} className={`mt-1 ${selectClassName}`} data-testid="po-supplier"><option value="">Choose…</option>{(suppliers.data?.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div><Label htmlFor="po-note">Note</Label><Input id="po-note" value={draftNote} onChange={(event) => setDraftNote(event.target.value)} maxLength={500} className="mt-1" data-testid="po-note" /></div>
          </div>
          {lines.map((line, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_7rem_8rem_auto] sm:items-end" data-testid={`po-line-${index}`}>
              <select value={line.productId} onChange={(event) => setLines(lines.map((item, i) => (i === index ? { ...item, productId: event.target.value } : item)))} className={selectClassName} aria-label="Product" data-testid={`po-line-product-${index}`}>
                <option value="">Product…</option>
                {(catalog.data?.data ?? []).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
              <Input type="number" min={1} value={line.quantity} onChange={(event) => setLines(lines.map((item, i) => (i === index ? { ...item, quantity: event.target.value } : item)))} placeholder="Qty" aria-label="Quantity" data-testid={`po-line-quantity-${index}`} />
              <Input inputMode="decimal" value={line.unitCost} onChange={(event) => setLines(lines.map((item, i) => (i === index ? { ...item, unitCost: event.target.value } : item)))} placeholder="Unit cost" aria-label="Unit cost" data-testid={`po-line-cost-${index}`} />
              <Button type="button" variant="outline" size="sm" onClick={() => setLines(lines.length === 1 ? [{ productId: '', quantity: '', unitCost: '' }] : lines.filter((_, i) => i !== index))} data-testid={`po-line-remove-${index}`}>Remove</Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { productId: '', quantity: '', unitCost: '' }])} data-testid="po-add-line">Add line</Button>
            <Button type="submit" size="sm" disabled={!draftValid || createDraft.isPending} data-testid="po-create">Create draft</Button>
          </div>
          {draftError && <p className="text-sm text-red-700" role="alert" data-testid="po-draft-error">{draftError}</p>}
        </form>
      </Surface>

      <Surface variant="default" padding="none" className="overflow-hidden" data-testid="purchase-orders">
        <h2 className="border-b border-stone-200 p-4 text-lg font-semibold text-slate-950">Purchase orders</h2>
        {actionError && <p className="px-4 pt-3 text-sm text-red-700" role="alert" data-testid="po-action-error">{actionError}</p>}
        {!orders.isLoading && (orders.data?.data.content ?? []).length === 0 && <p className="p-4 text-sm text-slate-500" data-testid="po-empty">No purchase orders yet.</p>}
        <ul className="divide-y divide-stone-100">
          {(orders.data?.data.content ?? []).map((order) => (
            <li key={order.id} className="space-y-3 p-4" data-testid={`po-${order.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span><span className="font-medium text-slate-950">PO #{order.id}</span> <span className="text-slate-500">· {order.supplierName} · {formatPrice(order.totalCost ?? 0)}{order.expectedAt ? ` · expected ${formatDateTime(order.expectedAt)}` : ''}</span></span>
                <StatusBadge status={order.status} testId={`po-status-${order.id}`} />
              </div>
              <ul className="text-sm text-slate-600">
                {(order.lines ?? []).map((line) => <li key={line.productId} data-testid={`po-line-summary-${order.id}-${line.productId}`}>{line.productName}: {line.receivedQuantity}/{line.orderedQuantity} at {formatPrice(line.unitCost ?? 0)}</li>)}
              </ul>
              <div className="flex flex-wrap gap-2">
                {order.status === 'DRAFT' && <Button size="sm" onClick={() => transition.mutate(() => purchasing.submit(order.id as number))} data-testid={`po-submit-${order.id}`}>Submit</Button>}
                {(order.status === 'DRAFT' || order.status === 'SUBMITTED') && <Button size="sm" variant="outline" onClick={() => transition.mutate(() => purchasing.cancel(order.id as number))} data-testid={`po-cancel-${order.id}`}>Cancel</Button>}
              </div>
              {(order.status === 'SUBMITTED' || order.status === 'PARTIALLY_RECEIVED') && <ReceiveForm key={`${order.id}-${order.updatedAt}`} order={order} onDone={refresh} />}
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
