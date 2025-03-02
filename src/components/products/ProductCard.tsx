import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types/product';
import { cart } from '../../lib/api';
import { CartItemDto, UpdateCartItemDto } from '../../types/cart';
import { useToast } from '../../hooks/useToast';
import { useQueryClient, useQuery } from '@tanstack/react-query';

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
    enabled: !!localStorage.getItem('token'),
  });

  const cartItem = cartData?.data?.items?.find(item => item.productId === product.id);
  const cartQuantity = cartItem?.quantity || 0;

  useEffect(() => {
    if (cartQuantity > 0) {
      setQuantity(cartQuantity);
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
        const updateData: UpdateCartItemDto = {
          quantity
        };
        await cart.updateCartItem(product.id, updateData);
        
        toast({
          variant: 'success',
          title: 'Cart updated',
          description: `${product.name} quantity set to ${quantity}`
        });
      } else {
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

  const navigateToProductDetails = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <div 
      className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
      onClick={navigateToProductDetails}
    >
      <div className="h-48 overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            No image available
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold h-14 line-clamp-2">{product.name}</h3>
        <p className="text-gray-600 mt-1 font-bold">${product.price.toFixed(2)}</p>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2 flex-grow">{product.description}</p>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <button 
                className="px-2 py-1 border rounded-l"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(prev => Math.max(1, prev - 1));
                }}
              >
                -
              </button>
              <span className="px-4 py-1 border-t border-b">{quantity}</span>
              <button 
                className="px-2 py-1 border rounded-r"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(prev => Math.min(product.stockQuantity, prev + 1));
                }}
              >
                +
              </button>
            </div>
            {cartQuantity > 0 && (
              <span className="text-sm text-blue-600 font-medium">
                {cartQuantity} in cart
              </span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {product.stockQuantity > 0 
                ? `${product.stockQuantity} in stock` 
                : 'Out of stock'}
            </p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center min-w-[120px] font-medium shadow-sm"
              onClick={handleAddToCart}
              disabled={isLoading || product.stockQuantity < 1}
            >
              {isLoading ? 'Adding...' : cartQuantity > 0 ? 'Update Cart' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 