import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cart } from '../../types/cart';
import { cart } from '../../lib/api';

interface CartSummaryProps {
  cartData: Cart;
  onUpdate: () => void;
}

export function CartSummary({ cartData, onUpdate }: CartSummaryProps) {
  const [isClearing, setIsClearing] = useState(false);
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
      onUpdate();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="p-6" data-testid="cart-summary">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="mb-4 md:mb-0" data-testid="cart-summary-info">
          <h2 className="text-lg font-semibold mb-2" data-testid="cart-summary-title">Cart Summary</h2>
          <div className="flex space-x-6">
            <div data-testid="cart-summary-items">
              <span className="text-sm font-medium text-gray-500 uppercase block">Items</span>
              <span className="text-lg" data-testid="cart-summary-items-count">{safeCartData.totalItems}</span>
            </div>
            
            <div data-testid="cart-summary-total">
              <span className="text-sm font-medium text-gray-500 uppercase block">Total</span>
              <span className="text-xl font-bold" data-testid="cart-summary-total-price">${safeCartData.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3" data-testid="cart-summary-actions">
          <button
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleCheckout}
            disabled={safeCartData.items.length === 0}
            data-testid="cart-checkout-button"
          >
            Proceed to Checkout
          </button>
          
          <button
            className="bg-white text-red-600 border border-red-600 py-2 px-4 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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