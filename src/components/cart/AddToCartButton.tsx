import { useState } from 'react';
import { cart } from '../../lib/api';
import { CartItemDto } from '../../types/cart';

interface AddToCartButtonProps {
  productId: number;
  disabled?: boolean;
  className?: string;
  onSuccess?: () => void;
  'data-testid'?: string;
}

export function AddToCartButton({ 
  productId, 
  disabled = false, 
  className = '',
  onSuccess,
  'data-testid': dataTestId 
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
    <div className="inline-flex items-center" data-testid={dataTestId || `add-to-cart-container-${productId}`}>
      {showQuantity ? (
        <>
          <div className="flex items-center mr-2" data-testid={`add-to-cart-quantity-controls-${productId}`}>
            <button 
              className="px-2 py-1 border rounded-l"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              disabled={isLoading}
              data-testid={`add-to-cart-decrease-${productId}`}
            >
              -
            </button>
            <span className="px-3 py-1 border-t border-b" data-testid={`add-to-cart-quantity-${productId}`}>{quantity}</span>
            <button 
              className="px-2 py-1 border rounded-r"
              onClick={() => setQuantity(prev => prev + 1)}
              disabled={isLoading}
              data-testid={`add-to-cart-increase-${productId}`}
            >
              +
            </button>
          </div>
          <button
            className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 ${className}`}
            onClick={handleAddToCart}
            disabled={isLoading || disabled}
            data-testid={`add-to-cart-submit-${productId}`}
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        </>
      ) : (
        <button
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 ${className}`}
          onClick={() => setShowQuantity(true)}
          disabled={disabled}
          data-testid={`add-to-cart-button-${productId}`}
        >
          Add to Cart
        </button>
      )}
    </div>
  );
} 