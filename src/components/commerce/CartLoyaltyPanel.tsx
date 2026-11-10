import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartTenders, loyalty } from '../../lib/api';
import { CART_COUPON_QUERY_KEY } from '../../lib/commerceQueryKeys';
import { LOYALTY_ACCOUNT_QUERY_KEY } from '../../lib/tenderQueryKeys';
import { useMoney } from '../../hooks/useMoney';
import { formatPoints, pointsError, pointsValue, POINTS_PER_UNIT } from '../../lib/payment';
import { serverMessage } from '../../lib/requestErrors';
import type { CartWithCoupon } from '../../types/commerce';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

/** Shows the loyalty balance and redeems points (in hundreds) against the cart. */
export function CartLoyaltyPanel({ cart }: { cart?: CartWithCoupon }) {
  const { formatMoney } = useMoney();
  const queryClient = useQueryClient();
  const [points, setPoints] = useState('');
  const [error, setError] = useState<string | null>(null);
  const account = useQuery({ queryKey: LOYALTY_ACCOUNT_QUERY_KEY, queryFn: loyalty.account, retry: false });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: CART_COUPON_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  };
  const apply = useMutation({
    mutationFn: (value: number) => cartTenders.applyPoints(value),
    onSuccess: () => {
      setPoints('');
      setError(null);
      refresh();
    },
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to redeem these points.')),
  });
  const remove = useMutation({
    mutationFn: () => cartTenders.removePoints(),
    onSuccess: () => {
      setError(null);
      refresh();
    },
    onError: (mutationError) => setError(serverMessage(mutationError, 'Unable to remove the points.')),
  });

  const balance = account.data?.data?.balance ?? 0;
  const redeemable = Math.floor(balance / POINTS_PER_UNIT) * POINTS_PER_UNIT;
  const redeemed = cart?.pointsRedeemed ?? 0;
  const validation = pointsError(points, balance);
  const parsed = Number(points);
  const canApply = points.trim() !== '' && validation === null && !apply.isPending;

  return (
    <div className="border-t border-stone-200 p-6" data-testid="cart-loyalty-panel">
      <h3 className="text-sm font-semibold text-slate-950">Loyalty points</h3>
      {account.isError ? (
        <p className="mt-2 text-sm text-slate-500" data-testid="cart-loyalty-unavailable">Loyalty points are unavailable right now.</p>
      ) : (
        <p className="mt-2 text-sm text-slate-600" data-testid="cart-loyalty-balance">
          Balance: <span className="font-semibold text-slate-950">{formatPoints(balance)} points</span> (worth {formatMoney(pointsValue(balance))})
        </p>
      )}
      {redeemed > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-3" data-testid="cart-loyalty-applied">
          <span className="text-sm text-emerald-700" data-testid="cart-loyalty-redeemed">
            Redeeming {formatPoints(redeemed)} points (−{formatMoney(cart?.pointsAmount ?? 0)})
          </span>
          <Button variant="outline" size="sm" onClick={() => remove.mutate()} disabled={remove.isPending} data-testid="cart-loyalty-remove">Remove</Button>
        </div>
      ) : !account.isError && redeemable > 0 ? (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (canApply) apply.mutate(parsed);
          }}
          data-testid="cart-loyalty-form"
        >
          <div className="flex-1">
            <Label htmlFor="cart-loyalty-points-input" className="sr-only">Points to redeem</Label>
            <Input
              id="cart-loyalty-points-input"
              type="number"
              inputMode="numeric"
              min={POINTS_PER_UNIT}
              max={redeemable}
              step={POINTS_PER_UNIT}
              value={points}
              onChange={(event) => setPoints(event.target.value)}
              placeholder={`Points (max ${formatPoints(redeemable)})`}
              aria-describedby="cart-loyalty-preview"
              error={validation ?? undefined}
              data-testid="cart-loyalty-points-input"
            />
          </div>
          <Button type="button" variant="outline" onClick={() => setPoints(String(redeemable))} data-testid="cart-loyalty-use-max">Use {formatPoints(redeemable)}</Button>
          <Button type="submit" disabled={!canApply} data-testid="cart-loyalty-apply">{apply.isPending ? 'Applying…' : 'Apply'}</Button>
        </form>
      ) : !account.isError && account.isSuccess ? (
        <p className="mt-2 text-xs text-slate-500" data-testid="cart-loyalty-minimum">Collect at least {POINTS_PER_UNIT} points to redeem them.</p>
      ) : null}
      {redeemed === 0 && points.trim() !== '' && (
        validation
          ? <p className="mt-2 text-sm text-red-700" id="cart-loyalty-points-input-error" data-testid="cart-loyalty-validation">{validation}</p>
          : <p className="mt-2 text-sm text-slate-600" id="cart-loyalty-preview" data-testid="cart-loyalty-preview">{formatPoints(parsed)} points = −{formatMoney(pointsValue(parsed))}</p>
      )}
      {error && <p className="mt-2 text-sm text-red-700" role="alert" data-testid="cart-loyalty-error">{error}</p>}
    </div>
  );
}
