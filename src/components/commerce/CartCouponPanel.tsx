import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartCoupon } from '../../lib/api';
import { CART_COUPON_QUERY_KEY } from '../../lib/commerceQueryKeys';
import { formatPrice } from '../../lib/format';
import { serverMessage } from '../../lib/requestErrors';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

/** Applies and removes a cart coupon and previews the discount checkout will use. */
export function CartCouponPanel() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const summary = useQuery({ queryKey: CART_COUPON_QUERY_KEY, queryFn: cartCoupon.summary });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: CART_COUPON_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  };
  const apply = useMutation({
    mutationFn: (value: string) => cartCoupon.apply(value),
    onSuccess: () => {
      setCode('');
      setError(null);
      refresh();
    },
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to apply this coupon.')),
  });
  const remove = useMutation({
    mutationFn: () => cartCoupon.remove(),
    onSuccess: () => {
      setError(null);
      refresh();
    },
  });

  const cart = summary.data?.data;
  const appliedCode = cart?.couponCode;

  return (
    <div className="border-t border-stone-200 p-6" data-testid="cart-coupon-panel">
      <h3 className="text-sm font-semibold text-slate-950">Coupon</h3>
      {appliedCode ? (
        <div className="mt-3 space-y-2" data-testid="cart-coupon-applied">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wider text-stone-50" data-testid="cart-coupon-code">{appliedCode}</span>
            <Button variant="outline" size="sm" onClick={() => remove.mutate()} disabled={remove.isPending} data-testid="cart-coupon-remove">Remove</Button>
          </div>
          {cart?.couponValid ? (
            <dl className="grid max-w-xs grid-cols-2 gap-1 text-sm" data-testid="cart-coupon-totals">
              <dt className="text-slate-500">Discount</dt>
              <dd className="text-right font-medium text-emerald-700" data-testid="cart-coupon-discount">−{formatPrice(cart.discountAmount ?? 0)}</dd>
              <dt className="text-slate-500">After discount</dt>
              <dd className="text-right font-semibold text-slate-950" data-testid="cart-coupon-total-after">{formatPrice(cart.totalAfterDiscount ?? 0)}</dd>
            </dl>
          ) : (
            <p className="text-sm text-amber-800" role="status" data-testid="cart-coupon-invalid">
              This coupon does not apply right now: {cart?.couponMessage}
            </p>
          )}
        </div>
      ) : (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim()) apply.mutate(code.trim());
          }}
          data-testid="cart-coupon-form"
        >
          <div className="flex-1">
            <Label htmlFor="cart-coupon-input" className="sr-only">Coupon code</Label>
            <Input id="cart-coupon-input" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Coupon code" maxLength={64} data-testid="cart-coupon-input" />
          </div>
          <Button type="submit" disabled={!code.trim() || apply.isPending} data-testid="cart-coupon-apply">{apply.isPending ? 'Applying…' : 'Apply'}</Button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-700" role="alert" data-testid="cart-coupon-error">{error}</p>}
    </div>
  );
}
