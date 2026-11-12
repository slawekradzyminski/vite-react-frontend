import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { giftCards } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { formatUtcDate } from '../../lib/commerceFormat';
import { responseStatus, serverMessage } from '../../lib/requestErrors';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { StatusBadge } from '../commerce/shared';

/** Looks up a gift card's remaining balance, status and expiry by its code. */
export function GiftCardBalanceChecker() {
  const [code, setCode] = useState('');
  const check = useMutation({ mutationFn: (value: string) => giftCards.balance(value) });
  const result = check.data?.data;
  const errorMessage = check.isError
    ? responseStatus(check.error) === 404 ? 'No gift card has this code.' : serverMessage(check.error, 'The balance could not be checked.')
    : null;

  return (
    <div data-testid="gift-card-checker">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (code.trim()) check.mutate(code.trim());
        }}
        data-testid="gift-card-checker-form"
      >
        <div className="flex-1">
          <Label htmlFor="gift-card-checker-input" data-testid="gift-card-checker-label">Gift card code</Label>
          <Input id="gift-card-checker-input" className="mt-2 font-mono" value={code} onChange={(event) => setCode(event.target.value)} placeholder="GC-XXXX-XXXX-XXXX" maxLength={64} autoComplete="off" data-testid="gift-card-checker-input" />
        </div>
        <Button type="submit" disabled={!code.trim() || check.isPending} data-testid="gift-card-checker-submit">{check.isPending ? 'Checking…' : 'Check balance'}</Button>
      </form>
      {errorMessage && <p className="mt-3 text-sm text-red-700" role="alert" data-testid="gift-card-checker-error">{errorMessage}</p>}
      {result && (
        <dl className="mt-4 grid max-w-sm grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm" role="status" data-testid="gift-card-checker-result">
          <dt className="text-slate-500">Code</dt>
          <dd className="font-mono text-slate-900" data-testid="gift-card-checker-code">{result.code}</dd>
          <dt className="text-slate-500">Balance</dt>
          <dd className="font-semibold text-slate-950" data-testid="gift-card-checker-balance">{formatPrice(result.balance ?? 0)}</dd>
          <dt className="text-slate-500">Status</dt>
          <dd><StatusBadge status={result.status} testId="gift-card-checker-status" /></dd>
          {result.expiresAt && (
            <>
              <dt className="text-slate-500">Valid until</dt>
              <dd className="text-slate-700" data-testid="gift-card-checker-expires">{formatUtcDate(result.expiresAt)}</dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}
