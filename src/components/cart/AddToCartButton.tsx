import { useState } from 'react';
import { cart } from '../../lib/api';
import { CartItemDto } from '../../types/cart';

interface AddToCartButtonProps {
  productId: number;
  disabled?: boolean;
  className?: string;
  onSuccess?: () => void;
}

export function AddToCartButton({ 
  productId, 
  disabled = false, 
  className = '',
  onSuccess 
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuantity, setShowQuantity] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      const cartItem: CartItemDto = {
        productId,
        quantity
      };
      await cart.addToCart(cartItem);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center">
      {showQuantity ? (
        <>
          <div className="flex items-center mr-2">
            <button 
              className="px-2 py-1 border rounded-l"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              disabled={isLoading}
            >
              -
            </button>
            <span className="px-3 py-1 border-t border-b">{quantity}</span>
            <button 
              className="px-2 py-1 border rounded-r"
              onClick={() => setQuantity(prev => prev + 1)}
              disabled={isLoading}
            >
              +
            </button>
          </div>
          <button
            className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 ${className}`}
            onClick={handleAddToCart}
            disabled={isLoading || disabled}
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        </>
      ) : (
        <button
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 ${className}`}
          onClick={() => setShowQuantity(true)}
          disabled={disabled}
        >
          Add to Cart
        </button>
      )}
    </div>
  );
} 