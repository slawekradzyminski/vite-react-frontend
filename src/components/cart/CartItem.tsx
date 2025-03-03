import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CartItem as CartItemType } from '../../types/cart';
import { cart } from '../../lib/api';

interface CartItemProps {
  item: CartItemType;
  onUpdate: () => void;
}

export function CartItem({ item, onUpdate }: CartItemProps) {
  const safeItem = {
    productId: item?.productId || 0,
    quantity: item?.quantity || 1,
    productName: item?.productName || 'Unknown Product',
    unitPrice: item?.unitPrice || 0,
    totalPrice: item?.totalPrice || 0,
    imageUrl: item?.imageUrl || ''
  };

  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [quantity, setQuantity] = useState(safeItem.quantity);
  
  // Reset quantity when item changes (after parent refresh)
  useEffect(() => {
    setQuantity(safeItem.quantity);
  }, [safeItem.quantity]);

  const handleQuantityChange = async () => {
    if (quantity === safeItem.quantity) return;
    
    setIsUpdating(true);
    try {
      await cart.updateCartItem(safeItem.productId, { quantity });
      // Refresh cart data from backend
      onUpdate();
    } catch (error) {
      console.error('Failed to update cart item:', error);
      setQuantity(safeItem.quantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await cart.removeFromCart(safeItem.productId);
      onUpdate();
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {safeItem.imageUrl && (
            <div className="flex-shrink-0 h-12 w-12 mr-4">
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={safeItem.imageUrl}
                alt={safeItem.productName}
              />
            </div>
          )}
          <div>
            <Link 
              to={`/products/${safeItem.productId}`} 
              className="text-blue-600 hover:text-blue-900 font-medium"
            >
              {safeItem.productName}
            </Link>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${safeItem.unitPrice.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col sm:flex-row items-start sm:items-center">
          <div className="flex items-center mb-2 sm:mb-0">
            <button 
              className="px-2 py-1 border rounded-l bg-gray-50 hover:bg-gray-100"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              disabled={isUpdating}
            >
              -
            </button>
            <span className="px-4 py-1 border-t border-b min-w-[40px] text-center">
              {quantity}
            </span>
            <button 
              className="px-2 py-1 border rounded-r bg-gray-50 hover:bg-gray-100"
              onClick={() => setQuantity(prev => prev + 1)}
              disabled={isUpdating}
            >
              +
            </button>
          </div>
          
          {quantity !== safeItem.quantity && (
            <button
              className="ml-0 sm:ml-2 text-blue-600 hover:text-blue-800 text-sm"
              onClick={handleQuantityChange}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        ${safeItem.totalPrice.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          className="text-red-600 hover:text-red-900"
          onClick={handleRemove}
          disabled={isRemoving}
        >
          {isRemoving ? 'Removing...' : 'Remove'}
        </button>
      </td>
    </tr>
  );
} 