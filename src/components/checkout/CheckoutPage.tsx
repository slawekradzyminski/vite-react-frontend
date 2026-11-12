import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { commerceTransport } from '../../lib/commerceTransport';
import { CART_COUPON_QUERY_KEY } from '../../lib/commerceQueryKeys';
import { Link, Navigate } from 'react-router';
import { cart, cartCoupon } from '../../lib/api';
import { CheckoutForm } from './CheckoutForm';
import { Surface } from '../ui/surface';
import { useEnrichedCart, type RawCartResponse } from '../../hooks/useEnrichedCart';
import { CartTendersSummary } from '../commerce/CartTendersSummary';
import { useMoney } from '../../hooks/useMoney';
import { isPaymentEnabled } from '../../lib/runtimeConfig';

export function CheckoutPage() {
  const { formatMoney } = useMoney();
  const { data: cartResponse, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: cart.getCart,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  const { data: couponResponse } = useQuery({ queryKey: CART_COUPON_QUERY_KEY, queryFn: cartCoupon.summary, retry: false, enabled: commerceTransport === 'rest' });
  const couponCart = couponResponse?.data;
  const rawData = cartResponse?.data as RawCartResponse;
  const { cartData, isEnriching } = useEnrichedCart(rawData);
  // Set when this checkout placed its order. The navigation to the next page runs in a transition, so
  // this page can still render the refetched (now empty) cart; it must not redirect to /cart then.
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (orderPlaced) {
    return (
      <Surface variant="muted" padding="message" className="text-center text-slate-500" role="status" aria-live="polite" data-testid="checkout-opening-payment">
        {isPaymentEnabled() ? 'Order placed. Opening payment…' : 'Order placed. Opening your order…'}
      </Surface>
    );
  }

  if (isLoading || isEnriching) {
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="checkout-loading">Loading checkout...</Surface>;
  }

  if (error) {
    return (
      <Surface variant="danger" padding="message" className="text-center" data-testid="checkout-error">
        <p className="mb-4 text-red-600">Error loading cart data</p>
        <Link to="/cart" className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline" data-testid="checkout-back-to-cart">
          Back to Cart
        </Link>
      </Surface>
    );
  }

  // A fresh visit with an empty cart has nothing to check out
  if (!rawData?.items || rawData.items.length === 0) {
    return <Navigate to="/cart" />;
  }

  const totalPrice = cartData.totalPrice;
  const totalItems = cartData.totalItems;

  return (
    <div className="space-y-6 pb-10" data-testid="checkout-page">
      <Surface as="section" variant="hero" padding="xl" data-testid="checkout-header">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Checkout</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="checkout-title">Checkout</h1>
          </div>
          <Link
            to="/cart"
            className="w-fit rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
            data-testid="checkout-back-button"
          >
            ← Back to Cart
          </Link>
        </div>
      </Surface>
      
      <div className="space-y-6" data-testid="checkout-content">
        <Surface variant="default" className="overflow-hidden" data-testid="checkout-form-section">
          <div className="border-b border-stone-200 px-6 py-4" data-testid="checkout-form-header">
            <h2 className="text-lg font-semibold text-slate-950" data-testid="checkout-shipping-title">Shipping Information</h2>
          </div>
          <div className="p-6" data-testid="checkout-form-container">
            <CheckoutForm
              cartTotal={totalPrice}
              payableTotal={couponCart?.amountDue ?? (couponCart?.couponCode && couponCart.couponValid ? couponCart.totalAfterDiscount : undefined)}
              onOrderPlaced={() => setOrderPlaced(true)}
            />
          </div>
        </Surface>
        
        <Surface variant="default" className="overflow-hidden" data-testid="checkout-summary-section">
          <div className="border-b border-stone-200 px-6 py-4" data-testid="checkout-summary-header">
            <h2 className="text-lg font-semibold text-slate-950" data-testid="checkout-summary-title">Order Summary</h2>
          </div>
          <div className="border-b border-stone-200 p-6" data-testid="checkout-summary-info">
            <div className="flex space-x-6" data-testid="checkout-summary-counts">
              <div data-testid="checkout-items-count">
                <span className="block text-sm font-medium uppercase text-slate-500">Items</span>
                <span className="text-lg text-slate-950" data-testid="checkout-items-value">{totalItems}</span>
              </div>
              
              <div data-testid="checkout-total">
                <span className="block text-sm font-medium uppercase text-slate-500">Total</span>
                <span className="text-xl font-bold text-slate-950" data-testid="checkout-total-value">{formatMoney(totalPrice)}</span>
              </div>

              {couponCart?.couponCode && couponCart.couponValid && (
                <div data-testid="checkout-discount">
                  <span className="block text-sm font-medium uppercase text-slate-500">Coupon {couponCart.couponCode}</span>
                  <span className="text-lg text-emerald-700" data-testid="checkout-discount-value">−{formatMoney(couponCart.discountAmount ?? 0)}</span>
                  <span className="block text-sm text-slate-600" data-testid="checkout-total-after-discount">You pay {formatMoney(couponCart.totalAfterDiscount ?? 0)}</span>
                </div>
              )}
            </div>
            <div className="mt-4"><CartTendersSummary cart={couponCart} prefix="checkout" /></div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200" data-testid="checkout-items-table">
              <thead className="bg-stone-50/80">
                <tr>
                  <th className="w-2/5 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white/60 space-y-0" data-testid="checkout-items-list">
                {cartData.items.map((item) => (
                  <tr key={item.productId} data-testid={`checkout-item-${item.productId}`}>
                    <td className="whitespace-nowrap px-6 py-4" data-testid={`checkout-item-product-${item.productId}`}>
                      <div className="flex items-center">
                        {item.imageUrl && (
                          <div className="mr-4 h-12 w-12 shrink-0">
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={item.imageUrl}
                              alt={item.productName}
                              data-testid={`checkout-item-image-${item.productId}`}
                            />
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-slate-900" data-testid={`checkout-item-name-${item.productId}`}>{item.productName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500" data-testid={`checkout-item-price-${item.productId}`}>
                      {formatMoney(item.unitPrice)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500" data-testid={`checkout-item-quantity-${item.productId}`}>
                      {item.quantity}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900" data-testid={`checkout-item-total-${item.productId}`}>
                      {formatMoney(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      </div>
    </div>
  );
} 
