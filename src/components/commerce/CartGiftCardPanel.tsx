import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartTenders } from '../../lib/api';
import { CART_COUPON_QUERY_KEY } from '../../lib/commerceQueryKeys';
import { useMoney } from '../../hooks/useMoney';
import { serverMessage } from '../../lib/requestErrors';
import type { CartWithCoupon } from '../../types/commerce';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

/** Applies or removes a gift card on the cart and shows how much of the total it covers. */
export function CartGiftCardPanel({ cart }: { cart?: CartWithCoupon }) {
  const { formatMoney } = useMoney();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: CART_COUPON_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  };
  const apply = useMutation({
    mutationFn: (value: string) => cartTenders.applyGiftCard(value),
    onSuccess: () => {
      setCode('');
      setError(null);
      refresh();
    },
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to apply this gift card.')),
  });
  const remove = useMutation({
    mutationFn: () => cartTenders.removeGiftCard(),
    onSuccess: () => {
      setError(null);
      refresh();
    },
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to remove the gift card.')),
  });

  const appliedCode = cart?.giftCardCode;

  return (
    <div className="border-t border-stone-200 p-6" data-testid="cart-gift-card-panel">
      <h3 className="text-sm font-semibold text-slate-950">Gift card</h3>
      {appliedCode ? (
        <div className="mt-3 flex flex-wrap items-center gap-3" data-testid="cart-gift-card-applied">
          <span className="rounded-full bg-slate-900 px-3 py-1 font-mono text-xs font-semibold tracking-wider text-stone-50" data-testid="cart-gift-card-code">{appliedCode}</span>
          {(cart?.giftCardAmount ?? 0) > 0 ? (
            <span className="text-sm text-emerald-700" data-testid="cart-gift-card-amount">Covers {formatMoney(cart?.giftCardAmount ?? 0)}</span>
          ) : (
            <span className="text-sm text-amber-800" data-testid="cart-gift-card-unusable">This card cannot be used right now.</span>
          )}
          <Button variant="outline" size="sm" onClick={() => remove.mutate()} disabled={remove.isPending} data-testid="cart-gift-card-remove">Remove</Button>
        </div>
      ) : (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim()) apply.mutate(code.trim());
          }}
          data-testid="cart-gift-card-form"
        >
          <div className="flex-1">
            <Label htmlFor="cart-gift-card-input" className="sr-only">Gift card code</Label>
            <Input id="cart-gift-card-input" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Gift card code" maxLength={64} autoComplete="off" data-testid="cart-gift-card-input" />
          </div>
          <Button type="submit" disabled={!code.trim() || apply.isPending} data-testid="cart-gift-card-apply">{apply.isPending ? 'Applying…' : 'Apply'}</Button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-700" role="alert" data-testid="cart-gift-card-error">{error}</p>}
    </div>
  );
}
