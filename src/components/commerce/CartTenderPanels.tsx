import { useQuery } from '@tanstack/react-query';
import { cartCoupon } from '../../lib/api';
import { CART_COUPON_QUERY_KEY } from '../../lib/commerceQueryKeys';
import { CartGiftCardPanel } from './CartGiftCardPanel';
import { CartLoyaltyPanel } from './CartLoyaltyPanel';
import { CartTendersSummary } from './CartTendersSummary';

/** Gift card and loyalty point tenders for the REST cart, next to the coupon panel. */
export function CartTenderPanels() {
  const summary = useQuery({ queryKey: CART_COUPON_QUERY_KEY, queryFn: cartCoupon.summary });
  const cart = summary.data?.data;
  return (
    <div data-testid="cart-tenders">
      <CartGiftCardPanel cart={cart} />
      <CartLoyaltyPanel cart={cart} />
      {cart?.amountDue != null && (
        <div className="border-t border-stone-200 p-6">
          <CartTendersSummary cart={cart} prefix="cart" />
        </div>
      )}
    </div>
  );
}
