import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CartItem as CartItemType } from '../../types/cart';
import { cart } from '../../lib/api';

interface CartItemProps {
  item: CartItemType;
  onUpdate: () => void;
}

export function CartItem({ item, onUpdate }: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = async () => {
    if (quantity === item.quantity) return;
    
    setIsUpdating(true);
    try {
      await cart.updateCartItem(item.productId, { quantity });
      onUpdate();
    } catch (error) {
      console.error('Failed to update cart item:', error);
      setQuantity(item.quantity); // Reset to original quantity on error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await cart.removeFromCart(item.productId);
      onUpdate();
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b">
      <div className="flex items-center mb-3 sm:mb-0">
        <Link to={`/products/${item.productId}`} className="text-blue-600 hover:underline font-medium">
          {item.productName}
        </Link>
        <span className="ml-2 text-gray-500">
          ${item.unitPrice.toFixed(2)} each
        </span>
      </div>
      
      <div className="flex items-center">
        <div className="flex items-center mr-4">
          <button 
            className="px-2 py-1 border rounded-l"
            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
            disabled={isUpdating}
          >
            -
          </button>
          <span className="px-4 py-1 border-t border-b">{quantity}</span>
          <button 
            className="px-2 py-1 border rounded-r"
            onClick={() => setQuantity(prev => prev + 1)}
            disabled={isUpdating}
          >
            +
          </button>
        </div>
        
        {quantity !== item.quantity && (
          <button
            className="text-blue-600 hover:text-blue-800 mr-4"
            onClick={handleQuantityChange}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
        )}
        
        <div className="text-right min-w-[80px]">
          ${item.totalPrice.toFixed(2)}
        </div>
        
        <button
          className="ml-4 text-red-600 hover:text-red-800"
          onClick={handleRemove}
          disabled={isRemoving}
        >
          {isRemoving ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </div>
  );
} 