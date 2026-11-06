import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { CartItem as CartItemType } from '../../types/cart';
import { cart, products } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { formatPrice } from '../../lib/format';
import { describeCartError, responseStatus, retryServerErrors } from '../../lib/requestErrors';

interface CartItemProps {
  item: CartItemType;
  onUpdate: () => void;
  // Reports a quantity changed in the row but not saved yet (null when in sync),
  // so checkout can save it instead of silently dropping it.
  onPendingChange?: (productId: number, quantity: number | null) => void;
}

export function CartItem({ item, onUpdate, onPendingChange }: CartItemProps) {
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
  const { toast } = useToast();

  // Stock is not part of the cart payload; the product query caps "+" (BUG-007).
  const { data: productResponse, refetch: refetchProduct } = useQuery({
    queryKey: ['product', String(safeItem.productId)],
    queryFn: () => products.getProductById(safeItem.productId),
    enabled: safeItem.productId > 0,
    retry: retryServerErrors,
  });
  const stock = productResponse?.data?.stockQuantity;
  const maxQuantity = stock === undefined ? Infinity : Math.max(stock, 1);
  
  useEffect(() => {
    onPendingChange?.(safeItem.productId, quantity === safeItem.quantity ? null : quantity);
    return () => onPendingChange?.(safeItem.productId, null);
  }, [onPendingChange, quantity, safeItem.productId, safeItem.quantity]);

  // Reset quantity when item changes (after parent refresh)
  useEffect(() => {
    setQuantity(safeItem.quantity);
  }, [safeItem.quantity]);

  const handleQuantityChange = async () => {
    if (quantity === safeItem.quantity) return;
    
    setIsUpdating(true);
    try {
      await cart.updateCartItem(safeItem.productId, { quantity });
      toast({
        variant: 'success',
        title: 'Cart updated',
        description: `${safeItem.productName} quantity set to ${quantity}`,
      });
      // Refresh cart data from backend
      onUpdate();
    } catch (error) {
      console.error('Failed to update cart item:', error);
      let description = describeCartError(error, 'Failed to update cart. Please try again.');
      if (responseStatus(error) === 409) {
        const { data: refreshed } = await refetchProduct();
        const freshStock = refreshed?.data?.stockQuantity;
        if (freshStock !== undefined) {
          description = freshStock > 0 ? `Only ${freshStock} left in stock.` : `${safeItem.productName} is now out of stock.`;
        }
      }
      toast({ variant: 'error', title: 'Error', description });
      setQuantity(safeItem.quantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await cart.removeFromCart(safeItem.productId);
      toast({
        variant: 'success',
        title: 'Removed from cart',
        description: `${safeItem.productName} has been removed from your cart`,
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      toast({
        variant: 'error',
        title: 'Error',
        description: describeCartError(error, 'Failed to remove from cart. Please try again.'),
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <tr data-testid={`cart-item-${safeItem.productId}`}>
      <td className="px-6 py-4 whitespace-nowrap" data-testid={`cart-item-product-${safeItem.productId}`}>
        <div className="flex items-center">
          {safeItem.imageUrl && (
            <div className="shrink-0 h-12 w-12 mr-4">
              <img
                className="h-12 w-12 rounded-2xl object-cover"
                src={safeItem.imageUrl}
                alt={safeItem.productName}
                data-testid={`cart-item-image-${safeItem.productId}`}
              />
            </div>
          )}
          <div>
            <Link 
              to={`/products/${safeItem.productId}`} 
              className="font-medium text-slate-900 transition hover:text-sky-700"
              data-testid={`cart-item-name-${safeItem.productId}`}
            >
              {safeItem.productName}
            </Link>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600" data-testid={`cart-item-price-${safeItem.productId}`}>
        {formatPrice(safeItem.unitPrice)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap" data-testid={`cart-item-quantity-cell-${safeItem.productId}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center">
          <div className="flex items-center mb-2 sm:mb-0" role="group" aria-label={`Quantity of ${safeItem.productName}`} data-testid={`cart-item-quantity-controls-${safeItem.productId}`}>
            <button 
              className="h-9 rounded-l-2xl border border-stone-200 bg-stone-50 px-3 text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-stone-50"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              disabled={isUpdating || quantity <= 1}
              aria-label={`Decrease quantity of ${safeItem.productName}`}
              data-testid={`cart-item-decrease-${safeItem.productId}`}
            >
              -
            </button>
            <span 
              className="flex h-9 min-w-[44px] items-center justify-center border-y border-stone-200 bg-white px-4 text-center text-sm font-medium text-slate-900"
              aria-live="polite"
              aria-atomic="true"
              data-testid={`cart-item-quantity-${safeItem.productId}`}
            >
              {quantity}
            </span>
            <button 
              className="h-9 rounded-r-2xl border border-stone-200 bg-stone-50 px-3 text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-stone-50"
              onClick={() => setQuantity(prev => Math.min(maxQuantity, prev + 1))}
              disabled={isUpdating || quantity >= maxQuantity}
              aria-label={`Increase quantity of ${safeItem.productName}`}
              data-testid={`cart-item-increase-${safeItem.productId}`}
            >
              +
            </button>
          </div>
          
          {quantity !== safeItem.quantity && (
            <button
              className="ml-0 text-sm font-medium text-sky-700 transition hover:text-sky-800 sm:ml-2"
              onClick={handleQuantityChange}
              disabled={isUpdating}
              aria-label={`Update quantity of ${safeItem.productName}`}
              data-testid={`cart-item-update-${safeItem.productId}`}
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900" data-testid={`cart-item-total-${safeItem.productId}`}>
        {formatPrice(safeItem.totalPrice)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          className="text-red-700 transition hover:text-red-800"
          onClick={handleRemove}
          disabled={isRemoving}
          aria-label={`Remove ${safeItem.productName} from cart`}
          data-testid={`cart-item-remove-${safeItem.productId}`}
        >
          {isRemoving ? 'Removing...' : 'Remove'}
        </button>
      </td>
    </tr>
  );
} 
