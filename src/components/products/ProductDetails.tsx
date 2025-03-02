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
  });

  // Get current cart to check if product is already in cart
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: cart.getCart,
    retry: false,
    enabled: !!localStorage.getItem('token'),
  });

  // Find current quantity in cart for this product
  const cartItem = cartData?.data?.items?.find(item => item.productId === Number(id));
  const cartQuantity = cartItem?.quantity || 0;

  // Initialize quantity with cart quantity if product is in cart
  useEffect(() => {
    if (cartQuantity > 0) {
      setQuantity(cartQuantity);
    } else {
      setQuantity(1); // Reset to 1 if item is not in cart
    }
  }, [cartQuantity]);

  const handleAddToCart = async () => {
    if (!product?.data) return;
    
    setIsAddingToCart(true);
    try {
      // Determine if we need to add or update based on whether item is already in cart
      if (cartQuantity > 0) {
        if (quantity === 0) {
          // Remove item from cart
          await cart.removeFromCart(product.data.id);
          
          toast({
            variant: 'success',
            title: 'Removed from cart',
            description: `${product.data.name} has been removed from your cart`
          });
        } else {
          // Update existing cart item with exact quantity
          const updateData: UpdateCartItemDto = {
            quantity
          };
          await cart.updateCartItem(product.data.id, updateData);
          
          // Show success toast
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
        
        // Show success toast
        toast({
          variant: 'success',
          title: 'Added to cart',
          description: `${quantity} × ${product.data.name} added to your cart`
        });
      }
      
      // Invalidate cart query to update cart count
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
      
      // Invalidate cart query to update cart count
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
    return <div className="text-center py-8">Loading product details...</div>;
  }

  if (error || !product?.data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error loading product details</p>
        <Link to="/products" className="text-blue-600 hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  const { data: productData } = product;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-4">
        <Link to="/products" className="text-blue-600 hover:underline">
          ← Back to Products
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {productData.imageUrl ? (
            <img 
              src={productData.imageUrl} 
              alt={productData.name} 
              className="w-full h-auto rounded-lg shadow-md"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              No image available
            </div>
          )}
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-2">{productData.name}</h1>
          <p className="text-2xl text-blue-600 mb-4">${productData.price.toFixed(2)}</p>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{productData.description}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Category</h2>
            <p className="text-gray-700">{productData.category}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Availability</h2>
            <p className={`${productData.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {productData.stockQuantity > 0 
                ? `${productData.stockQuantity} in stock` 
                : 'Out of stock'}
            </p>
            {cartQuantity > 0 && (
              <p className="text-blue-600 mt-1">
                {cartQuantity} in cart
              </p>
            )}
          </div>
          
          {productData.stockQuantity > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Quantity</h2>
              <div className="flex items-center">
                <button 
                  className="px-3 py-2 border rounded-l"
                  onClick={() => setQuantity(prev => Math.max(0, prev - 1))}
                >
                  -
                </button>
                <span className="px-6 py-2 border-t border-b">{quantity}</span>
                <button 
                  className="px-3 py-2 border rounded-r"
                  onClick={() => setQuantity(prev => Math.min(productData.stockQuantity, prev + 1))}
                >
                  +
                </button>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            {cartQuantity > 0 && (
              <button
                className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                onClick={handleRemoveFromCart}
                disabled={isRemovingFromCart || isAddingToCart}
              >
                {isRemovingFromCart ? 'Removing...' : 'Remove from Cart'}
              </button>
            )}
            
            <button
              className={`${cartQuantity > 0 ? 'flex-1' : 'w-full'} bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400`}
              onClick={handleAddToCart}
              disabled={isAddingToCart || isRemovingFromCart || productData.stockQuantity < 1 || (quantity === 0 && !cartQuantity)}
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