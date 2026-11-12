import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vatRates } from '../../lib/api';
import { refetchAfterWrite } from '../../lib/queryRefresh';
import { formatDateTime } from '../../lib/commerceFormat';
import { fieldErrorId } from '../../lib/fieldError';
import { serverMessage } from '../../lib/requestErrors';
import { vatRateSchema, type VatRateFormData } from '../../validators/adminCommerce';
import type { VatRate } from '../../types/commerce';
import { PageHeader } from '../commerce/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';
import { AdminSectionNav } from './AdminSectionNav';

const VAT_QUERY_KEY = ['admin-vat-rates'];

interface VatRateEditorProps {
  /** Existing country code, or null for a new rate. */
  countryCode: string | null;
  initial: VatRateFormData;
  onDone: () => void;
}

function VatRateEditor({ countryCode, initial, onDone }: VatRateEditorProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const prefix = countryCode ? `admin-vat-edit-${countryCode}` : 'admin-vat-new';
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VatRateFormData>({
    resolver: zodResolver(vatRateSchema),
    defaultValues: initial,
  });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await vatRates.upsert(values.countryCode.trim().toUpperCase(), { countryName: values.countryName.trim(), rate: Number(values.rate) });
      await refetchAfterWrite(queryClient, VAT_QUERY_KEY);
      onDone();
    } catch (failure) {
      setError(serverMessage(failure, 'Unable to save the VAT rate.'));
    }
  });

  const fieldError = (field: keyof VatRateFormData) => errors[field]?.message
    ? <p className="mt-1 text-xs text-red-700" role="alert" id={fieldErrorId(`${prefix}-${field}`)} data-testid={`${prefix}-${field}-error`}>{errors[field]?.message}</p>
    : null;

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 md:grid-cols-[8rem_minmax(0,1fr)_8rem_auto] md:items-start" aria-label={countryCode ? `Edit VAT rate for ${countryCode}` : 'New VAT rate'} data-testid={`${prefix}-form`}>
      <div>
        <Label htmlFor={`${prefix}-countryCode`}>Country code</Label>
        <Input id={`${prefix}-countryCode`} className="mt-1 uppercase" maxLength={2} readOnly={countryCode !== null} error={errors.countryCode?.message} {...register('countryCode')} data-testid={`${prefix}-country-code`} />
        {fieldError('countryCode')}
      </div>
      <div>
        <Label htmlFor={`${prefix}-countryName`}>Country name</Label>
        <Input id={`${prefix}-countryName`} className="mt-1" maxLength={64} error={errors.countryName?.message} {...register('countryName')} data-testid={`${prefix}-country-name`} />
        {fieldError('countryName')}
      </div>
      <div>
        <Label htmlFor={`${prefix}-rate`}>Rate (%)</Label>
        <Input id={`${prefix}-rate`} className="mt-1" inputMode="decimal" error={errors.rate?.message} {...register('rate')} data-testid={`${prefix}-rate`} />
        {fieldError('rate')}
      </div>
      <div className="flex gap-2 md:pt-6">
        <Button type="submit" size="sm" disabled={isSubmitting} data-testid={`${prefix}-save`}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
        {countryCode && <Button type="button" variant="outline" size="sm" onClick={onDone} data-testid={`${prefix}-cancel`}>Cancel</Button>}
      </div>
      {error && <p className="text-sm text-red-700 md:col-span-4" role="alert" data-testid={`${prefix}-error`}>{error}</p>}
    </form>
  );
}

const EMPTY: VatRateFormData = { countryCode: '', countryName: '', rate: '' };

export function AdminVatRates() {
  const list = useQuery({ queryKey: VAT_QUERY_KEY, queryFn: async () => (await vatRates.list()).data });
  const [editing, setEditing] = useState<string | null>(null);
  const [newKey, setNewKey] = useState(0);
  const items: VatRate[] = list.data ?? [];

  return (
    <div className="space-y-6 pb-10" data-testid="admin-vat-rates">
      <AdminSectionNav />
      <PageHeader eyebrow="Tax" title="VAT rates" description="Rates apply to orders created after a change; existing orders keep the rate they were placed with." />
      <Surface variant="default" padding="none" className="overflow-hidden">
        {list.isLoading && <p className="p-6 text-sm text-slate-500" data-testid="admin-vat-rates-loading">Loading VAT rates…</p>}
        {list.isError && <p className="p-6 text-sm text-red-700" role="alert" data-testid="admin-vat-rates-error">Unable to load VAT rates.</p>}
        {!list.isLoading && !list.isError && items.length === 0 && <p className="p-6 text-sm text-slate-500" data-testid="admin-vat-rates-empty">No VAT rates defined.</p>}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr><th scope="col" className="px-4 py-3">Country</th><th scope="col" className="px-4 py-3">Rate</th><th scope="col" className="px-4 py-3">Updated</th><th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {items.map((rate) => {
                  const code = rate.countryCode as string;
                  return editing === code ? (
                    <tr key={code} className="border-b border-stone-100 bg-sky-50/50" data-testid={`admin-vat-row-${code}`}>
                      <td colSpan={4} className="px-4 py-3">
                        <VatRateEditor countryCode={code} initial={{ countryCode: code, countryName: rate.countryName ?? '', rate: String(rate.rate ?? '') }} onDone={() => setEditing(null)} />
                      </td>
                    </tr>
                  ) : (
                    <tr key={code} className="border-b border-stone-100" data-testid={`admin-vat-row-${code}`}>
                      <td className="px-4 py-3"><span className="font-mono font-semibold text-slate-950">{code}</span> <span className="text-slate-600">{rate.countryName}</span></td>
                      <td className="px-4 py-3 font-semibold text-slate-900" data-testid={`admin-vat-rate-${code}`}>{rate.rate}%</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(rate.updatedAt)}</td>
                      <td className="px-4 py-3 text-right"><Button variant="outline" size="sm" onClick={() => setEditing(code)} aria-label={`Edit VAT rate for ${rate.countryName ?? code}`} data-testid={`admin-vat-edit-${code}`}>Edit</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
      <Surface as="section" variant="default" padding="lg" aria-labelledby="admin-vat-new-heading">
        <h2 id="admin-vat-new-heading" className="mb-3 text-lg font-semibold text-slate-950">Add or replace a country</h2>
        <VatRateEditor key={newKey} countryCode={null} initial={EMPTY} onDone={() => setNewKey((key) => key + 1)} />
      </Surface>
    </div>
  );
}
