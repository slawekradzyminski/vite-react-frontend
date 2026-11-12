import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminGiftCards } from '../../lib/api';
import { refetchAfterWrite } from '../../lib/queryRefresh';
import { formatPrice } from '../../lib/format';
import { formatDateTime, formatUtcDateTime, localInputToUtcIso, selectClassName } from '../../lib/commerceFormat';
import { fieldErrorId } from '../../lib/fieldError';
import { serverMessage } from '../../lib/requestErrors';
import { giftCardSchema, type GiftCardFormData } from '../../validators/adminCommerce';
import type { GiftCard, GiftCardCreateRequest, GiftCardStatus } from '../../types/commerce';
import { PageHeader, StatusBadge } from '../commerce/shared';
import { Button } from '../ui/button';
import { CopyButton } from '../ui/copy-button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ConfirmDialog, Modal } from '../ui/modal';
import { Surface } from '../ui/surface';
import { AdminPager } from './AdminPager';
import { AdminSectionNav } from './AdminSectionNav';

const STATUSES: GiftCardStatus[] = ['ACTIVE', 'REDEEMED', 'EXPIRED', 'DISABLED'];
const PAGE_SIZE = 20;
const EMPTY_FORM: GiftCardFormData = { amount: '', recipientUsername: '', note: '', expiresAt: '' };

function toRequest(form: GiftCardFormData): GiftCardCreateRequest {
  return {
    amount: Number(form.amount),
    recipientUsername: form.recipientUsername.trim() || null,
    note: form.note.trim() || null,
    expiresAt: form.expiresAt ? localInputToUtcIso(form.expiresAt) : null,
  };
}

function GiftCardIssueForm({ onIssued }: { onIssued: (card: GiftCard) => void }) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GiftCardFormData>({
    resolver: zodResolver(giftCardSchema),
    defaultValues: EMPTY_FORM,
  });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      const card = (await adminGiftCards.create(toRequest(values))).data;
      reset(EMPTY_FORM);
      onIssued(card);
    } catch (failure) {
      setError(serverMessage(failure, 'Unable to issue the gift card.'));
    }
  });

  const fieldError = (field: keyof GiftCardFormData) => errors[field]?.message
    ? <p className="mt-1 text-xs text-red-700" role="alert" id={fieldErrorId(`gift-card-${field}`)} data-testid={`admin-gift-card-${field}-error`}>{errors[field]?.message}</p>
    : null;

  return (
    <form className="space-y-3" onSubmit={submit} noValidate data-testid="admin-gift-card-form">
      <h2 className="text-lg font-semibold text-slate-950">Issue a gift card</h2>
      <div><Label htmlFor="gift-card-amount">Amount (USD)</Label><Input id="gift-card-amount" inputMode="decimal" className="mt-1" error={errors.amount?.message} {...register('amount')} data-testid="admin-gift-card-amount" />{fieldError('amount')}</div>
      <div><Label htmlFor="gift-card-recipientUsername">Recipient username (optional)</Label><Input id="gift-card-recipientUsername" className="mt-1" autoComplete="off" error={errors.recipientUsername?.message} {...register('recipientUsername')} data-testid="admin-gift-card-recipient" />{fieldError('recipientUsername')}</div>
      <div><Label htmlFor="gift-card-expiresAt">Expires (optional)</Label><Input id="gift-card-expiresAt" type="datetime-local" className="mt-1" error={errors.expiresAt?.message} {...register('expiresAt')} data-testid="admin-gift-card-expires" />{fieldError('expiresAt')}</div>
      <div><Label htmlFor="gift-card-note">Internal note (optional)</Label><Input id="gift-card-note" className="mt-1" maxLength={255} error={errors.note?.message} {...register('note')} data-testid="admin-gift-card-note" />{fieldError('note')}</div>
      {error && <p className="text-sm text-red-700" role="alert" data-testid="admin-gift-card-form-error">{error}</p>}
      <Button type="submit" disabled={isSubmitting} data-testid="admin-gift-card-issue">{isSubmitting ? 'Issuing…' : 'Issue gift card'}</Button>
    </form>
  );
}

function GiftCardDetails({ code, onClose }: { code: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const details = useQuery({
    queryKey: ['admin-gift-card', code],
    queryFn: async () => (await adminGiftCards.get(code as string)).data,
    enabled: code !== null,
  });
  const disable = useMutation({
    mutationFn: (value: string) => adminGiftCards.disable(value),
    onSuccess: () => { void refetchAfterWrite(queryClient, ['admin-gift-card', code], ['admin-gift-cards']); },
    onError: (failure) => setError(serverMessage(failure, 'Unable to disable the gift card.')),
    onSettled: () => setConfirming(false),
  });
  const card = details.data;

  return (
    <Modal open={code !== null} onClose={() => { setError(null); onClose(); }} placement="drawer" title={`Gift card ${code ?? ''}`} data-testid="admin-gift-card-details">
      {details.isLoading && <p className="text-sm text-slate-500" data-testid="admin-gift-card-details-loading">Loading gift card…</p>}
      {details.isError && <p className="text-sm text-red-700" role="alert" data-testid="admin-gift-card-details-error">Unable to load this gift card.</p>}
      {card && (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs uppercase text-slate-500">Status</dt><dd className="mt-1"><StatusBadge status={card.status} testId="admin-gift-card-details-status" /></dd></div>
            <div><dt className="text-xs uppercase text-slate-500">Balance</dt><dd className="mt-1 font-semibold" data-testid="admin-gift-card-details-balance">{formatPrice(card.balance ?? 0)} of {formatPrice(card.initialAmount ?? 0)}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">Recipient</dt><dd className="mt-1">{card.recipientUsername ?? '—'}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">Expires</dt><dd className="mt-1" data-testid="admin-gift-card-details-expires">{formatUtcDateTime(card.expiresAt)}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">Issued by</dt><dd className="mt-1">{card.createdBy ?? '—'}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">Note</dt><dd className="mt-1">{card.note ?? '—'}</dd></div>
          </dl>
          <section aria-labelledby="admin-gift-card-ledger-heading">
            <h3 id="admin-gift-card-ledger-heading" className="text-sm font-semibold text-slate-950">Ledger</h3>
            <table className="mt-2 w-full text-left text-sm" data-testid="admin-gift-card-ledger">
              <thead className="text-xs uppercase text-slate-500"><tr><th scope="col" className="py-1">When</th><th scope="col" className="py-1">Type</th><th scope="col" className="py-1">Amount</th><th scope="col" className="py-1">Balance</th><th scope="col" className="py-1">Order / actor</th></tr></thead>
              <tbody>
                {(card.transactions ?? []).map((entry, index) => (
                  <tr key={`${entry.createdAt}-${index}`} className="border-t border-stone-100" data-testid={`admin-gift-card-ledger-${index}`}>
                    <td className="py-1 text-slate-600">{formatDateTime(entry.createdAt)}</td>
                    <td className="py-1">{entry.type}</td>
                    <td className="py-1">{formatPrice(entry.amount ?? 0)}</td>
                    <td className="py-1">{formatPrice(entry.balanceAfter ?? 0)}</td>
                    <td className="py-1 text-slate-600">{entry.orderId != null ? `#${entry.orderId}` : entry.actor ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {error && <p className="text-sm text-red-700" role="alert" data-testid="admin-gift-card-disable-error">{error}</p>}
          {card.status === 'ACTIVE' && (
            <Button type="button" variant="destructive" onClick={() => setConfirming(true)} data-testid="admin-gift-card-disable">Disable gift card</Button>
          )}
          <ConfirmDialog
            open={confirming}
            title="Disable gift card?"
            message={`The remaining ${formatPrice(card.balance ?? 0)} can no longer be spent. This cannot be undone.`}
            confirmLabel="Disable"
            pending={disable.isPending}
            onConfirm={() => disable.mutate(card.code as string)}
            onCancel={() => setConfirming(false)}
            data-testid="admin-gift-card-disable-confirm"
          />
        </div>
      )}
    </Modal>
  );
}

export function AdminGiftCards() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<GiftCardStatus | ''>('');
  const [page, setPage] = useState(0);
  const [issued, setIssued] = useState<GiftCard | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ['admin-gift-cards', status, page],
    queryFn: async () => (await adminGiftCards.list(status || undefined, page, PAGE_SIZE)).data,
    placeholderData: keepPreviousData,
  });
  const items = list.data?.content ?? [];

  return (
    <div className="space-y-6 pb-10" data-testid="admin-gift-cards">
      <AdminSectionNav />
      <PageHeader eyebrow="Promotions" title="Gift cards" description="Issue prepaid cards, follow their ledger, and disable a card that should no longer be spent." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <Surface variant="default" padding="none" className="overflow-hidden">
          <div className="flex items-end gap-3 border-b border-stone-200 p-4">
            <div className="w-56">
              <Label htmlFor="admin-gift-cards-status">Status</Label>
              <select id="admin-gift-cards-status" value={status} onChange={(event) => { setStatus(event.target.value as GiftCardStatus | ''); setPage(0); }} className={`mt-1 ${selectClassName}`} data-testid="admin-gift-cards-status">
                <option value="">All statuses</option>
                {STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
          </div>
          {list.isLoading && <p className="p-6 text-sm text-slate-500" data-testid="admin-gift-cards-loading">Loading gift cards…</p>}
          {list.isError && <p className="p-6 text-sm text-red-700" role="alert" data-testid="admin-gift-cards-error">Unable to load gift cards.</p>}
          {!list.isLoading && !list.isError && items.length === 0 && <p className="p-6 text-sm text-slate-500" data-testid="admin-gift-cards-empty">No gift cards match this filter.</p>}
          {items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr><th scope="col" className="px-4 py-3">Code</th><th scope="col" className="px-4 py-3">Balance</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Recipient</th><th scope="col" className="px-4 py-3">Expires</th><th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody>
                  {items.map((card) => (
                    <tr key={card.code} className="border-b border-stone-100" data-testid={`admin-gift-card-row-${card.code}`}>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-950">{card.code}</td>
                      <td className="px-4 py-3" data-testid={`admin-gift-card-balance-${card.code}`}>{formatPrice(card.balance ?? 0)}<span className="block text-xs text-slate-500">of {formatPrice(card.initialAmount ?? 0)}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={card.status} testId={`admin-gift-card-status-${card.code}`} /></td>
                      <td className="px-4 py-3 text-slate-600">{card.recipientUsername ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600" data-testid={`admin-gift-card-expires-${card.code}`}>{formatUtcDateTime(card.expiresAt)}</td>
                      <td className="px-4 py-3 text-right"><Button variant="outline" size="sm" onClick={() => setSelected(card.code as string)} aria-label={`Details of gift card ${card.code}`} data-testid={`admin-gift-card-view-${card.code}`}>Details</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AdminPager page={page} totalPages={list.data?.totalPages ?? 0} onPageChange={setPage} testIdPrefix="admin-gift-cards" />
        </Surface>

        <Surface variant="default" padding="lg" className="space-y-4">
          {issued && (
            <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4" role="status" data-testid="admin-gift-card-issued">
              <p className="text-sm text-emerald-900">Issued a {formatPrice(issued.initialAmount ?? 0)} gift card{issued.recipientUsername ? ` for ${issued.recipientUsername}` : ''}:</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-white px-3 py-1 font-mono text-base font-semibold text-slate-950" data-testid="admin-gift-card-issued-code">{issued.code}</code>
                <CopyButton value={issued.code ?? ''} subject="Gift card code" data-testid="admin-gift-card-issued-copy" />
              </div>
            </div>
          )}
          <GiftCardIssueForm onIssued={(card) => { setIssued(card); void refetchAfterWrite(queryClient, ['admin-gift-cards']); }} />
        </Surface>
      </div>
      <GiftCardDetails code={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
