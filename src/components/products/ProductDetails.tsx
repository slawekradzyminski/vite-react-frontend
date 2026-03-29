import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { products, cart } from '../../lib/api';
import { CartItemDto, UpdateCartItemDto } from '../../types/cart';
import { useToast } from '../../hooks/useToast';
import { authStorage } from '../../lib/authStorage';
import { Surface } from '../ui/surface';
import { Badge } from '../ui/badge';

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isRemovingFromCart, setIsRemovingFromCart] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => products.getProductById(Number(id)),
    enabled: !!id,
    retry: (failureCount, error: any) => {
      if (error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: cart.getCart,
    enabled: !!authStorage.getAccessToken(),
    retry: false
  });

  const cartItem = cartData?.data?.items?.find(item => item.productId === Number(id));
  const cartQuantity = cartItem?.quantity || 0;

  useEffect(() => {
    if (cartQuantity > 0) {
      setQuantity(cartQuantity);
    } else {
      setQuantity(1);
    }
  }, [cartQuantity]);

  const handleAddToCart = async () => {
    if (!product?.data) return;
    
    setIsAddingToCart(true);
    try {
      if (cartQuantity > 0) {
        if (quantity === 0) {
          await cart.removeFromCart(product.data.id);
          
          toast({
            variant: 'success',
            title: 'Removed from cart',
            description: `${product.data.name} has been removed from your cart`
          });
        } else {
          const updateData: UpdateCartItemDto = {
            quantity
          };
          await cart.updateCartItem(product.data.id, updateData);
          
          toast({
            variant: 'success',
            title: 'Cart updated',
            description: `${product.data.name} quantity set to ${quantity}`
          });
        }
      } else {
        // Add new item to cart
        const cartItem: CartItemDto = {
          productId: product.data.id,
          quantity
        };
        await cart.addToCart(cartItem);
        
        toast({
          variant: 'success',
          title: 'Added to cart',
          description: `${quantity} × ${product.data.name} added to your cart`
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch (error) {
      console.error('Failed to update cart:', error);
      toast({
        variant: 'error',
        description: 'Failed to update cart. Please try again.'
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleRemoveFromCart = async () => {
    if (!product?.data) return;
    
    setIsRemovingFromCart(true);
    try {
      await cart.removeFromCart(product.data.id);
      
      toast({
        variant: 'success',
        title: 'Removed from cart',
        description: `${product.data.name} has been removed from your cart`
      });
      
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast({
        variant: 'error',
        description: 'Failed to remove from cart. Please try again.'
      });
    } finally {
      setIsRemovingFromCart(false);
    }
  };

  if (isLoading) {
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="product-loading">Loading product details...</Surface>;
  }

  if (error || !product?.data) {
    return (
      <Surface variant="danger" padding="message" className="text-center" data-testid="product-not-found">
        <p className="mb-4 text-red-600">Error loading product details</p>
        <Link to="/products" className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline">
          Back to Products
        </Link>
      </Surface>
    );
  }

  const { data: productData } = product;

  return (
    <div className="space-y-6 pb-10" data-testid="product-details">
      <div data-testid="product-back-link-container">
        <Link to="/products" className="text-sm font-medium text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline" data-testid="product-back-link">
          ← Back to Products
        </Link>
      </div>
      
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]" data-testid="product-details-content">
        <Surface
          variant="default"
          className="overflow-hidden"
          data-testid="product-image-container"
        >
          {productData.imageUrl ? (
            <img 
              src={productData.imageUrl} 
              alt={productData.name} 
              className="h-full min-h-[320px] w-full object-cover"
              data-testid="product-image"
            />
          ) : (
            <div className="flex min-h-[320px] w-full items-center justify-center bg-stone-100 text-sm font-medium text-slate-400" data-testid="product-no-image">
              No image available
            </div>
          )}
        </Surface>

        <Surface
          variant="default"
          padding="lg"
          data-testid="product-info-container"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Product detail</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950" data-testid="product-title">{productData.name}</h1>
            </div>
            <Badge className="px-4 py-2 text-xl font-semibold text-slate-950" data-testid="product-price">${productData.price.toFixed(2)}</Badge>
          </div>
          
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div data-testid="product-description-section">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500" data-testid="product-description-title">Description</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600" data-testid="product-description">{productData.description}</p>
            </div>
            
            <div className="space-y-6">
              <div data-testid="product-category-section">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500" data-testid="product-category-title">Category</h2>
                <p className="mt-3 text-sm font-medium text-slate-900" data-testid="product-category">{productData.category}</p>
              </div>
              
              <div data-testid="product-availability-section">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500" data-testid="product-availability-title">Availability</h2>
                <p className={`mt-3 text-sm font-medium ${productData.stockQuantity > 0 ? 'text-emerald-700' : 'text-red-600'}`} data-testid="product-stock">
                  {productData.stockQuantity > 0 
                    ? `${productData.stockQuantity} in stock` 
                    : 'Out of stock'}
                </p>
                {cartQuantity > 0 && (
                  <p className="mt-1 text-sm font-medium text-sky-700" data-testid="product-cart-quantity">
                    {cartQuantity} in cart
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {productData.stockQuantity > 0 && (
            <div className="mt-8 border-t border-stone-200/80 pt-6" data-testid="product-quantity-section">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500" data-testid="product-quantity-title">Quantity</h2>
              <div className="mt-3 flex items-center" data-testid="product-quantity-controls">
                <button 
                  className="h-11 rounded-l-2xl border border-stone-200 bg-stone-50 px-4 text-slate-700 transition hover:bg-white"
                  onClick={() => setQuantity(prev => Math.max(0, prev - 1))}
                  data-testid="decrease-quantity"
                >
                  -
                </button>
                <span className="flex h-11 min-w-[64px] items-center justify-center border-y border-stone-200 bg-white px-6 text-sm font-medium text-slate-900" data-testid="quantity-value">{quantity}</span>
                <button 
                  className="h-11 rounded-r-2xl border border-stone-200 bg-stone-50 px-4 text-slate-700 transition hover:bg-white"
                  onClick={() => setQuantity(prev => Math.min(productData.stockQuantity, prev + 1))}
                  data-testid="increase-quantity"
                >
                  +
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex flex-wrap gap-3" data-testid="product-actions">
            {cartQuantity > 0 && (
              <button
                className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:border-stone-200 disabled:bg-stone-100 disabled:text-slate-400"
                onClick={handleRemoveFromCart}
                disabled={isRemovingFromCart || isAddingToCart}
                data-testid="remove-from-cart"
              >
                {isRemovingFromCart ? 'Removing...' : 'Remove from Cart'}
              </button>
            )}
            
            <button
              className={`${cartQuantity > 0 ? 'flex-1' : 'w-full'} rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-stone-50 transition hover:bg-slate-800 disabled:bg-stone-300`}
              onClick={handleAddToCart}
              disabled={isAddingToCart || isRemovingFromCart || productData.stockQuantity < 1 || (quantity === 0 && !cartQuantity)}
              data-testid="add-to-cart"
            >
              {isAddingToCart 
                ? 'Adding to Cart...' 
                : cartQuantity > 0 
                  ? quantity === 0 
                    ? 'Remove from Cart' 
                    : 'Update Cart' 
                  : 'Add to Cart'
              }
            </button>
          </div>
        </Surface>
      </div>
    </div>
  );
} 
