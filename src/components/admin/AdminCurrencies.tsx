import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { currencies } from '../../lib/api';
import { formatDateTime } from '../../lib/commerceFormat';
import { fieldErrorId } from '../../lib/fieldError';
import { serverMessage } from '../../lib/requestErrors';
import { currencySchema, type CurrencyFormData } from '../../validators/adminCommerce';
import type { Currency } from '../../types/commerce';
import { PageHeader } from '../commerce/shared';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';
import { AdminSectionNav } from './AdminSectionNav';

const CURRENCY_QUERY_KEY = ['admin-currencies'];
const BASE_CURRENCY = 'USD';

interface CurrencyEditorProps {
  code: string | null;
  initial: CurrencyFormData;
  onDone: () => void;
}

function CurrencyEditor({ code, initial, onDone }: CurrencyEditorProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const prefix = code ? `admin-currency-edit-${code}` : 'admin-currency-new';
  const isBase = code === BASE_CURRENCY;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    defaultValues: initial,
  });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await currencies.upsert(values.code.trim().toUpperCase(), { name: values.name.trim(), symbol: values.symbol.trim(), rateToUsd: Number(values.rateToUsd) });
      await queryClient.invalidateQueries({ queryKey: CURRENCY_QUERY_KEY });
      onDone();
    } catch (failure) {
      setError(serverMessage(failure, 'Unable to save the currency.'));
    }
  });

  const fieldError = (field: keyof CurrencyFormData) => errors[field]?.message
    ? <p className="mt-1 text-xs text-red-700" role="alert" id={fieldErrorId(`${prefix}-${field}`)} data-testid={`${prefix}-${field}-error`}>{errors[field]?.message}</p>
    : null;

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 md:grid-cols-[7rem_minmax(0,1fr)_6rem_10rem_auto] md:items-start" aria-label={code ? `Edit currency ${code}` : 'New currency'} data-testid={`${prefix}-form`}>
      <div>
        <Label htmlFor={`${prefix}-code`}>Code</Label>
        <Input id={`${prefix}-code`} className="mt-1 uppercase" maxLength={3} readOnly={code !== null} error={errors.code?.message} {...register('code')} data-testid={`${prefix}-code`} />
        {fieldError('code')}
      </div>
      <div>
        <Label htmlFor={`${prefix}-name`}>Name</Label>
        <Input id={`${prefix}-name`} className="mt-1" maxLength={64} error={errors.name?.message} {...register('name')} data-testid={`${prefix}-name`} />
        {fieldError('name')}
      </div>
      <div>
        <Label htmlFor={`${prefix}-symbol`}>Symbol</Label>
        <Input id={`${prefix}-symbol`} className="mt-1" maxLength={8} error={errors.symbol?.message} {...register('symbol')} data-testid={`${prefix}-symbol`} />
        {fieldError('symbol')}
      </div>
      <div>
        <Label htmlFor={`${prefix}-rateToUsd`}>Rate to USD</Label>
        <Input
          id={`${prefix}-rateToUsd`}
          className="mt-1"
          inputMode="decimal"
          readOnly={isBase}
          aria-describedby={isBase ? `${prefix}-base-hint` : undefined}
          error={errors.rateToUsd?.message}
          {...register('rateToUsd')}
          data-testid={`${prefix}-rate`}
        />
        {isBase && <p id={`${prefix}-base-hint`} className="mt-1 text-xs text-slate-500">Base currency, locked to 1.</p>}
        {fieldError('rateToUsd')}
      </div>
      <div className="flex gap-2 md:pt-6">
        <Button type="submit" size="sm" disabled={isSubmitting} data-testid={`${prefix}-save`}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
        {code && <Button type="button" variant="outline" size="sm" onClick={onDone} data-testid={`${prefix}-cancel`}>Cancel</Button>}
      </div>
      {error && <p className="text-sm text-red-700 md:col-span-5" role="alert" data-testid={`${prefix}-error`}>{error}</p>}
    </form>
  );
}

const EMPTY: CurrencyFormData = { code: '', name: '', symbol: '', rateToUsd: '' };

export function AdminCurrencies() {
  const list = useQuery({ queryKey: CURRENCY_QUERY_KEY, queryFn: async () => (await currencies.list()).data });
  const [editing, setEditing] = useState<string | null>(null);
  const [newKey, setNewKey] = useState(0);
  const items: Currency[] = list.data ?? [];

  return (
    <div className="space-y-6 pb-10" data-testid="admin-currencies">
      <AdminSectionNav />
      <PageHeader eyebrow="Pricing" title="Currencies" description="Display currencies and their value in US dollars. Prices are stored in USD, the base currency." />
      <Surface variant="default" padding="none" className="overflow-hidden">
        {list.isLoading && <p className="p-6 text-sm text-slate-500" data-testid="admin-currencies-loading">Loading currencies…</p>}
        {list.isError && <p className="p-6 text-sm text-red-700" role="alert" data-testid="admin-currencies-error">Unable to load currencies.</p>}
        {!list.isLoading && !list.isError && items.length === 0 && <p className="p-6 text-sm text-slate-500" data-testid="admin-currencies-empty">No currencies defined.</p>}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr><th scope="col" className="px-4 py-3">Currency</th><th scope="col" className="px-4 py-3">Symbol</th><th scope="col" className="px-4 py-3">Rate to USD</th><th scope="col" className="px-4 py-3">Updated</th><th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {items.map((currency) => {
                  const code = currency.code as string;
                  return editing === code ? (
                    <tr key={code} className="border-b border-stone-100 bg-sky-50/50" data-testid={`admin-currency-row-${code}`}>
                      <td colSpan={5} className="px-4 py-3">
                        <CurrencyEditor code={code} initial={{ code, name: currency.name ?? '', symbol: currency.symbol ?? '', rateToUsd: String(currency.rateToUsd ?? '') }} onDone={() => setEditing(null)} />
                      </td>
                    </tr>
                  ) : (
                    <tr key={code} className="border-b border-stone-100" data-testid={`admin-currency-row-${code}`}>
                      <td className="px-4 py-3"><span className="font-mono font-semibold text-slate-950">{code}</span> <span className="text-slate-600">{currency.name}</span>{code === BASE_CURRENCY && <Badge className="ml-2" data-testid="admin-currency-base">Base</Badge>}</td>
                      <td className="px-4 py-3">{currency.symbol}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900" data-testid={`admin-currency-rate-${code}`}>{currency.rateToUsd}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(currency.updatedAt)}</td>
                      <td className="px-4 py-3 text-right"><Button variant="outline" size="sm" onClick={() => setEditing(code)} aria-label={`Edit currency ${code}`} data-testid={`admin-currency-edit-${code}`}>Edit</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
      <Surface as="section" variant="default" padding="lg" aria-labelledby="admin-currency-new-heading">
        <h2 id="admin-currency-new-heading" className="mb-3 text-lg font-semibold text-slate-950">Add a currency</h2>
        <CurrencyEditor key={newKey} code={null} initial={EMPTY} onDone={() => setNewKey((key) => key + 1)} />
      </Surface>
    </div>
  );
}
