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
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Cart Summary</h2>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span>Items:</span>
          <span>{safeCartData.totalItems}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg">
          <span>Total:</span>
          <span>${safeCartData.totalPrice.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <button
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          onClick={handleCheckout}
          disabled={safeCartData.items.length === 0}
        >
          Proceed to Checkout
        </button>
        
        <button
          className="w-full bg-white text-red-600 border border-red-600 py-2 px-4 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
          onClick={handleClearCart}
          disabled={isClearing || safeCartData.items.length === 0}
        >
          {isClearing ? 'Clearing...' : 'Clear Cart'}
        </button>
      </div>
    </div>
  );
} 