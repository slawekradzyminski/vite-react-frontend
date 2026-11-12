import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coupons } from '../../lib/api';
import { refetchAfterWrite } from '../../lib/queryRefresh';
import { formatPrice } from '../../lib/format';
import { serverMessage } from '../../lib/requestErrors';
import { type CouponForm, validateCouponForm } from '../../lib/commerceValidation';
import type { Coupon, CouponRequest, CouponType } from '../../types/commerce';
import { formatDateTime, selectClassName } from '../../lib/commerceFormat';
import { PageHeader, StatusBadge } from '../commerce/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';
import { AdminSectionNav } from './AdminSectionNav';

const EMPTY: CouponForm = { code: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', validFrom: '', validUntil: '', maxRedemptions: '', perUserLimit: '1', active: true };

const toInput = (value?: string | null) => (value ? value.slice(0, 16) : '');

function toRequest(form: CouponForm): CouponRequest {
  return {
    code: form.code.trim(),
    description: form.description.trim() || undefined,
    type: form.type,
    value: Number(form.value),
    minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
    validFrom: form.validFrom ? `${form.validFrom}:00` : undefined,
    validUntil: form.validUntil ? `${form.validUntil}:00` : undefined,
    maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : undefined,
    perUserLimit: Number(form.perUserLimit),
    active: form.active,
  };
}

function describeValue(coupon: Coupon) {
  return coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : formatPrice(coupon.value ?? 0);
}

export function AdminCoupons() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CouponForm>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = useQuery({ queryKey: ['admin-coupons'], queryFn: () => coupons.list() });
  const refresh = () => refetchAfterWrite(queryClient, ['admin-coupons']);
  const reset = () => { setForm(EMPTY); setEditingId(null); setTouched(false); setError(null); };
  const save = useMutation({
    mutationFn: (request: CouponRequest) => (editingId ? coupons.update(editingId, request) : coupons.create(request)),
    onSuccess: () => { reset(); refresh(); },
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to save the coupon.')),
  });
  const remove = useMutation({
    mutationFn: (id: number) => coupons.remove(id),
    onSuccess: refresh,
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to delete the coupon.')),
  });
  const errors = validateCouponForm(form);
  const field = (key: keyof CouponForm) => touched && errors[key]
    ? <p className="mt-1 text-xs text-red-700" role="alert" data-testid={`coupon-${key}-error`}>{errors[key]}</p>
    : null;
  const edit = (coupon: Coupon) => {
    setEditingId(coupon.id as number);
    setForm({
      code: coupon.code ?? '', description: coupon.description ?? '', type: (coupon.type ?? 'PERCENTAGE') as CouponType,
      value: String(coupon.value ?? ''), minOrderAmount: coupon.minOrderAmount != null ? String(coupon.minOrderAmount) : '',
      validFrom: toInput(coupon.validFrom), validUntil: toInput(coupon.validUntil),
      maxRedemptions: coupon.maxRedemptions != null ? String(coupon.maxRedemptions) : '', perUserLimit: String(coupon.perUserLimit ?? 1), active: Boolean(coupon.active),
    });
  };
  const items = list.data?.data.content ?? [];

  return (
    <div className="space-y-6 pb-10" data-testid="admin-coupons">
      <AdminSectionNav />
      <PageHeader eyebrow="Promotions" title="Coupons" description="Create discount codes and control when and how often they can be used." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <Surface variant="default" padding="none" className="overflow-hidden">
          {list.isError && <p className="p-6 text-sm text-red-700" role="alert" data-testid="coupons-error">Unable to load coupons.</p>}
          {!list.isLoading && items.length === 0 && <p className="p-6 text-sm text-slate-500" data-testid="coupons-empty">No coupons yet.</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Usage</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-stone-100" data-testid={`coupon-row-${coupon.id}`}>
                    <td className="px-4 py-3"><span className="font-semibold text-slate-950" data-testid={`coupon-code-${coupon.id}`}>{coupon.code}</span><p className="text-xs text-slate-500">{coupon.description}</p></td>
                    <td className="px-4 py-3">{describeValue(coupon)}{coupon.minOrderAmount != null && <span className="block text-xs text-slate-500">from {formatPrice(coupon.minOrderAmount)}</span>}</td>
                    <td className="px-4 py-3" data-testid={`coupon-usage-${coupon.id}`}>{coupon.redemptionCount}{coupon.maxRedemptions != null ? ` / ${coupon.maxRedemptions}` : ''}<span className="block text-xs text-slate-500">{coupon.perUserLimit} per user</span></td>
                    <td className="px-4 py-3"><StatusBadge status={coupon.status} testId={`coupon-status-${coupon.id}`} />{coupon.validUntil && <span className="block text-xs text-slate-500">until {formatDateTime(coupon.validUntil)}</span>}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => edit(coupon)} data-testid={`coupon-edit-${coupon.id}`}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => { if (window.confirm(`Delete coupon ${coupon.code}?`)) remove.mutate(coupon.id as number); }} data-testid={`coupon-delete-${coupon.id}`}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>

        <Surface variant="default" padding="lg">
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); setTouched(true); if (Object.keys(errors).length === 0) save.mutate(toRequest(form)); }} data-testid="coupon-form">
            <h2 className="text-lg font-semibold text-slate-950" data-testid="coupon-form-title">{editingId ? `Edit coupon #${editingId}` : 'New coupon'}</h2>
            <div><Label htmlFor="coupon-code">Code</Label><Input id="coupon-code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="mt-1" data-testid="coupon-code" />{field('code')}</div>
            <div><Label htmlFor="coupon-description">Description</Label><Input id="coupon-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={255} className="mt-1" data-testid="coupon-description" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="coupon-type">Type</Label><select id="coupon-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CouponType })} className={`mt-1 ${selectClassName}`} data-testid="coupon-type"><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount</option></select></div>
              <div><Label htmlFor="coupon-value">{form.type === 'PERCENTAGE' ? 'Percent' : 'Amount'}</Label><Input id="coupon-value" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} inputMode="decimal" className="mt-1" data-testid="coupon-value" />{field('value')}</div>
            </div>
            <div><Label htmlFor="coupon-min">Minimum subtotal</Label><Input id="coupon-min" value={form.minOrderAmount} onChange={(event) => setForm({ ...form, minOrderAmount: event.target.value })} inputMode="decimal" className="mt-1" data-testid="coupon-min-order" />{field('minOrderAmount')}</div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="coupon-from">Valid from</Label><Input id="coupon-from" type="datetime-local" value={form.validFrom} onChange={(event) => setForm({ ...form, validFrom: event.target.value })} className="mt-1" data-testid="coupon-valid-from" /></div>
              <div><Label htmlFor="coupon-until">Valid until</Label><Input id="coupon-until" type="datetime-local" value={form.validUntil} onChange={(event) => setForm({ ...form, validUntil: event.target.value })} className="mt-1" data-testid="coupon-valid-until" />{field('validUntil')}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="coupon-max">Total uses</Label><Input id="coupon-max" value={form.maxRedemptions} onChange={(event) => setForm({ ...form, maxRedemptions: event.target.value })} inputMode="numeric" placeholder="Unlimited" className="mt-1" data-testid="coupon-max-redemptions" />{field('maxRedemptions')}</div>
              <div><Label htmlFor="coupon-per-user">Uses per customer</Label><Input id="coupon-per-user" value={form.perUserLimit} onChange={(event) => setForm({ ...form, perUserLimit: event.target.value })} inputMode="numeric" className="mt-1" data-testid="coupon-per-user" />{field('perUserLimit')}</div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} data-testid="coupon-active" />Active</label>
            {error && <p className="text-sm text-red-700" role="alert" data-testid="coupon-form-error">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={save.isPending} data-testid="coupon-save">{editingId ? 'Save changes' : 'Create coupon'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={reset} data-testid="coupon-cancel-edit">Cancel</Button>}
            </div>
          </form>
        </Surface>
      </div>
    </div>
  );
}
