import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { cart } from '../../lib/api';
import { CheckoutForm } from './CheckoutForm';
import { Surface } from '../ui/surface';
import { useEnrichedCart, type RawCartResponse } from '../../hooks/useEnrichedCart';

export function CheckoutPage() {
  const { data: cartResponse, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: cart.getCart,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  const rawData = cartResponse?.data as RawCartResponse;
  const { cartData, isEnriching } = useEnrichedCart(rawData);

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

  // Redirect to cart if cart is empty
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
            <CheckoutForm cartTotal={totalPrice} />
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
                <span className="text-xl font-bold text-slate-950" data-testid="checkout-total-value">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
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
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500" data-testid={`checkout-item-quantity-${item.productId}`}>
                      {item.quantity}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900" data-testid={`checkout-item-total-${item.productId}`}>
                      ${item.totalPrice.toFixed(2)}
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
