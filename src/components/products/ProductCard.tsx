import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types/product';
import { cart } from '../../lib/api';
import { CartItemDto, UpdateCartItemDto } from '../../types/cart';
import { useToast } from '../../hooks/useToast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { authStorage } from '../../lib/authStorage';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number, quantity: number) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: cart.getCart,
    retry: false,
    enabled: !!authStorage.getAccessToken(),
  });

  const cartItem = cartData?.data?.items?.find(item => item.productId === product.id);
  const cartQuantity = cartItem?.quantity || 0;

  useEffect(() => {
    if (cartQuantity > 0) {
      setQuantity(cartQuantity);
    } else {
      setQuantity(1); // Reset to 1 if item is not in cart
    }
  }, [cartQuantity]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking the add to cart button
    
    if (onAddToCart) {
      onAddToCart(product.id, quantity);
      return;
    }

    setIsLoading(true);
    try {
      if (cartQuantity > 0) {
        if (quantity === 0) {
          // Remove item from cart
          await cart.removeFromCart(product.id);
          
          toast({
            variant: 'success',
            title: 'Removed from cart',
            description: `${product.name} has been removed from your cart`
          });
        } else {
          // Update quantity
          const updateData: UpdateCartItemDto = {
            quantity
          };
          await cart.updateCartItem(product.id, updateData);
          
          toast({
            variant: 'success',
            title: 'Cart updated',
            description: `${product.name} quantity set to ${quantity}`
          });
        }
      } else {
        // Add new item to cart
        const cartItem: CartItemDto = {
          productId: product.id,
          quantity
        };
        await cart.addToCart(cartItem);
        
        toast({
          variant: 'success',
          title: 'Added to cart',
          description: `${quantity} × ${product.name} added to your cart`
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch {
      toast({
        variant: 'error',
        description: 'Failed to update cart. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation
    
    setIsLoading(true);
    try {
      await cart.removeFromCart(product.id);
      
      toast({
        variant: 'success',
        title: 'Removed from cart',
        description: `${product.name} has been removed from your cart`
      });
      
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch {
      toast({
        variant: 'error',
        description: 'Failed to remove from cart. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToProductDetails = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <div 
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-white/88 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_28px_70px_-45px_rgba(15,23,42,0.55)]"
      onClick={navigateToProductDetails}
      data-testid="product-item"
    >
      <div className="h-52 overflow-hidden bg-stone-100" data-testid="product-image-container">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="h-52 w-full object-cover transition duration-300 hover:scale-[1.03]"
            data-testid="product-image"
          />
        ) : (
          <div className="flex h-52 w-full items-center justify-center bg-stone-100 text-sm font-medium text-slate-400" data-testid="product-no-image">
            No image available
          </div>
        )}
      </div>
      <div className="flex grow flex-col p-5" data-testid="product-content">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-h-14 text-lg font-semibold leading-7 text-slate-950 line-clamp-2" data-testid="product-name">{product.name}</h3>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm font-semibold text-slate-900" data-testid="product-price">
            ${product.price.toFixed(2)}
          </span>
        </div>
        {product.category && (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500" data-testid="product-category">{product.category}</p>
        )}
        <p className="mt-3 grow text-sm leading-6 text-slate-600 line-clamp-3" data-testid="product-description">{product.description}</p>
        <div className="mt-5 border-t border-stone-200/80 pt-4" data-testid="product-controls">
          <div className="mb-3 flex items-center justify-between gap-3" data-testid="product-quantity-container">
            <div className="flex items-center" data-testid="product-quantity-controls">
              <button 
                className="h-10 rounded-l-2xl border border-stone-200 bg-stone-50 px-3 text-slate-700 transition hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(prev => Math.max(0, prev - 1));
                }}
                data-testid="product-decrease-quantity"
              >
                -
              </button>
              <span className="flex h-10 min-w-[52px] items-center justify-center border-y border-stone-200 bg-white px-4 text-sm font-medium text-slate-900" data-testid="product-quantity-value">{quantity}</span>
              <button 
                className="h-10 rounded-r-2xl border border-stone-200 bg-stone-50 px-3 text-slate-700 transition hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(prev => Math.min(product.stockQuantity, prev + 1));
                }}
                data-testid="product-increase-quantity"
              >
                +
              </button>
            </div>
            {cartQuantity > 0 && (
              <span className="text-sm font-medium text-sky-700" data-testid="product-card-cart-quantity">
                {cartQuantity} in cart
              </span>
            )}
          </div>
          <div className="flex justify-between items-center" data-testid="product-actions">
            <div className="flex gap-2 w-full justify-end" data-testid="product-buttons">
              {cartQuantity > 0 && (
                <button
                  className="flex min-w-[96px] items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:border-stone-200 disabled:bg-stone-100 disabled:text-slate-400"
                  onClick={handleRemoveFromCart}
                  disabled={isLoading}
                  aria-label="Remove from cart"
                  data-testid="product-remove-button"
                >
                  {isLoading ? '...' : 'Remove'}
                </button>
              )}
              <button
                className="flex min-w-[128px] items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-slate-800 disabled:bg-stone-300"
                onClick={handleAddToCart}
                disabled={isLoading || product.stockQuantity < 1 || (quantity === 0 && !cartQuantity)}
                data-testid="product-add-button"
              >
                {isLoading ? 'Adding...' : cartQuantity > 0 ? (quantity === 0 ? 'Remove' : 'Update Cart') : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
