import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Cart } from '../../types/cart';
import { cart } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useMoney } from '../../hooks/useMoney';
import { describeCartError } from '../../lib/requestErrors';

interface CartSummaryProps {
  cartData: Cart;
  onUpdate: () => void;
  beforeCheckout?: () => Promise<void>;
}

export function CartSummary({ cartData, onUpdate, beforeCheckout }: CartSummaryProps) {
  const { formatMoney } = useMoney();
  const [isClearing, setIsClearing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Ensure we have valid cart data with defaults
  const safeCartData = {
    items: cartData?.items || [],
    totalPrice: cartData?.totalPrice || 0,
    totalItems: cartData?.totalItems || 0,
    username: cartData?.username || ''
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;
    
    setIsClearing(true);
    try {
      await cart.clearCart();
      toast({
        variant: 'success',
        title: 'Cart cleared',
        description: 'All items have been removed from your cart',
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast({
        variant: 'error',
        title: 'Error',
        description: 'Failed to clear cart. Please try again.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleCheckout = async () => {
    if (beforeCheckout) {
      setIsCheckingOut(true);
      try {
        await beforeCheckout();
      } catch (error) {
        console.error('Failed to save cart changes before checkout:', error);
        toast({
          variant: 'error',
          title: 'Error',
          description: describeCartError(error, 'Failed to save your cart changes. Please try again.'),
        });
        setIsCheckingOut(false);
        onUpdate();
        return;
      }
    }
    navigate('/checkout');
  };

  return (
    <div className="p-6" data-testid="cart-summary">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="mb-0" data-testid="cart-summary-info">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Snapshot</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950" data-testid="cart-summary-title">Cart Summary</h2>
          <div className="mt-4 flex space-x-6">
            <div data-testid="cart-summary-items">
              <span className="block text-sm font-medium uppercase text-slate-500">Items</span>
              <span className="text-lg font-semibold text-slate-950" data-testid="cart-summary-items-count">{safeCartData.totalItems}</span>
            </div>
            
            <div data-testid="cart-summary-total">
              <span className="block text-sm font-medium uppercase text-slate-500">Total</span>
              <span className="text-xl font-bold text-slate-950" data-testid="cart-summary-total-price">{formatMoney(safeCartData.totalPrice)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3" data-testid="cart-summary-actions">
          <button
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800 disabled:bg-stone-300 disabled:cursor-not-allowed"
            onClick={handleCheckout}
            disabled={isCheckingOut || safeCartData.items.length === 0}
            data-testid="cart-checkout-button"
          >
            {isCheckingOut ? 'Saving changes...' : 'Proceed to Checkout'}
          </button>
          
          <button
            className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClearCart}
            disabled={isClearing || safeCartData.items.length === 0}
            data-testid="cart-clear-button"
          >
            {isClearing ? 'Clearing...' : 'Clear Cart'}
          </button>
        </div>
      </div>
    </div>
  );
} 
