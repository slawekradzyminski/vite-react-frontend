import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CartItem as CartItemType } from '../../types/cart';
import { cart, products } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useMoney } from '../../hooks/useMoney';
import { describeCartError, responseStatus } from '../../lib/requestErrors';

interface CartItemProps {
  item: CartItemType;
  onUpdate: () => void;
  // Reports a quantity changed in the row but not saved yet (null when in sync),
  // so checkout can save it instead of silently dropping it.
  onPendingChange?: (productId: number, quantity: number | null) => void;
}

export function CartItem({ item, onUpdate, onPendingChange }: CartItemProps) {
  const { formatMoney } = useMoney();
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

  // Stock arrives with the cart (GraphQL product field or REST enrichment), so the
  // row needs no request of its own to cap "+" (BUG-007).
  const stock = item?.stockQuantity;
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
        // The stock may have changed since the cart was loaded; report the current value.
        try {
          const { data: fresh } = await products.getProductById(safeItem.productId);
          description = fresh.stockQuantity > 0 ? `Only ${fresh.stockQuantity} left in stock.` : `${safeItem.productName} is now out of stock.`;
        } catch {
          // Keep the generic stock message when the product cannot be read.
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
    <tr className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 lg:table-row lg:p-0" data-testid={`cart-item-${safeItem.productId}`}>
      <td className="col-span-2 block min-w-0 lg:table-cell lg:px-6 lg:py-4 lg:whitespace-nowrap" data-testid={`cart-item-product-${safeItem.productId}`}>
        <div className="flex items-center">
          {safeItem.imageUrl && (
            <div className="shrink-0 h-12 w-12 mr-4">
              <img
                className="h-12 w-12 rounded-2xl object-cover"
                src={safeItem.imageUrl}
                alt=""
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
      <td className="block text-sm text-slate-600 before:mb-1 before:block before:text-xs before:font-medium before:uppercase before:tracking-wider before:text-slate-500 lg:before:content-none before:content-['Price'] lg:table-cell lg:px-6 lg:py-4 lg:whitespace-nowrap" data-testid={`cart-item-price-${safeItem.productId}`}>
        {formatMoney(safeItem.unitPrice)}
      </td>
      <td className="col-span-2 row-start-3 block before:mb-1 before:block before:text-xs before:font-medium before:uppercase before:tracking-wider before:text-slate-500 lg:before:content-none before:content-['Quantity'] lg:table-cell lg:px-6 lg:py-4 lg:whitespace-nowrap" data-testid={`cart-item-quantity-cell-${safeItem.productId}`}>
        <div className="flex flex-row flex-wrap items-center gap-2 lg:gap-0">
          <div className="flex items-center" role="group" aria-label={`Quantity of ${safeItem.productName}`} data-testid={`cart-item-quantity-controls-${safeItem.productId}`}>
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
              className="ml-0 text-sm font-medium text-sky-700 transition hover:text-sky-800 lg:ml-2"
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
      <td className="block text-right text-sm font-medium text-slate-900 before:mb-1 before:block before:text-xs before:font-medium before:uppercase before:tracking-wider before:text-slate-500 lg:before:content-none before:content-['Total'] lg:table-cell lg:px-6 lg:py-4 lg:text-left lg:whitespace-nowrap" data-testid={`cart-item-total-${safeItem.productId}`}>
        {formatMoney(safeItem.totalPrice)}
      </td>
      <td className="col-span-2 block text-right text-sm font-medium lg:table-cell lg:px-6 lg:py-4 lg:whitespace-nowrap">
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
