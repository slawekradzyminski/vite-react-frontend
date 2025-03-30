import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { products, cart } from '../../lib/api';
import { CartItemDto, UpdateCartItemDto } from '../../types/cart';
import { useToast } from '../../hooks/useToast';

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
    enabled: !!localStorage.getItem('token'),
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
    return <div className="text-center py-8" data-testid="product-loading">Loading product details...</div>;
  }

  if (error || !product?.data) {
    return (
      <div className="text-center py-8" data-testid="product-not-found">
        <p className="text-red-500 mb-4">Error loading product details</p>
        <Link to="/products" className="text-blue-600 hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  const { data: productData } = product;

  return (
    <div className="max-w-6xl mx-auto p-4" data-testid="product-details">
      <div className="mb-4" data-testid="product-back-link-container">
        <Link to="/products" className="text-blue-600 hover:underline" data-testid="product-back-link">
          ← Back to Products
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8" data-testid="product-details-content">
        <div data-testid="product-image-container">
          {productData.imageUrl ? (
            <img 
              src={productData.imageUrl} 
              alt={productData.name} 
              className="w-full h-auto rounded-lg shadow-md"
              data-testid="product-image"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center" data-testid="product-no-image">
              No image available
            </div>
          )}
        </div>
        
        <div data-testid="product-info-container">
          <h1 className="text-3xl font-bold mb-2" data-testid="product-title">{productData.name}</h1>
          <p className="text-2xl text-blue-600 mb-4" data-testid="product-price">${productData.price.toFixed(2)}</p>
          
          <div className="mb-6" data-testid="product-description-section">
            <h2 className="text-lg font-semibold mb-2" data-testid="product-description-title">Description</h2>
            <p className="text-gray-700" data-testid="product-description">{productData.description}</p>
          </div>
          
          <div className="mb-6" data-testid="product-category-section">
            <h2 className="text-lg font-semibold mb-2" data-testid="product-category-title">Category</h2>
            <p className="text-gray-700" data-testid="product-category">{productData.category}</p>
          </div>
          
          <div className="mb-6" data-testid="product-availability-section">
            <h2 className="text-lg font-semibold mb-2" data-testid="product-availability-title">Availability</h2>
            <p className={`${productData.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="product-stock">
              {productData.stockQuantity > 0 
                ? `${productData.stockQuantity} in stock` 
                : 'Out of stock'}
            </p>
            {cartQuantity > 0 && (
              <p className="text-blue-600 mt-1" data-testid="product-cart-quantity">
                {cartQuantity} in cart
              </p>
            )}
          </div>
          
          {productData.stockQuantity > 0 && (
            <div className="mb-6" data-testid="product-quantity-section">
              <h2 className="text-lg font-semibold mb-2" data-testid="product-quantity-title">Quantity</h2>
              <div className="flex items-center" data-testid="product-quantity-controls">
                <button 
                  className="px-3 py-2 border rounded-l"
                  onClick={() => setQuantity(prev => Math.max(0, prev - 1))}
                  data-testid="decrease-quantity"
                >
                  -
                </button>
                <span className="px-6 py-2 border-t border-b" data-testid="quantity-value">{quantity}</span>
                <button 
                  className="px-3 py-2 border rounded-r"
                  onClick={() => setQuantity(prev => Math.min(productData.stockQuantity, prev + 1))}
                  data-testid="increase-quantity"
                >
                  +
                </button>
              </div>
            </div>
          )}
          
          <div className="flex gap-3" data-testid="product-actions">
            {cartQuantity > 0 && (
              <button
                className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                onClick={handleRemoveFromCart}
                disabled={isRemovingFromCart || isAddingToCart}
                data-testid="remove-from-cart"
              >
                {isRemovingFromCart ? 'Removing...' : 'Remove from Cart'}
              </button>
            )}
            
            <button
              className={`${cartQuantity > 0 ? 'flex-1' : 'w-full'} bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400`}
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
        </div>
      </div>
    </div>
  );
} 