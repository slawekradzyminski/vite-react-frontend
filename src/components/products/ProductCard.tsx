import { useState } from 'react';
import { Product } from '../../types/product';
import { cart } from '../../lib/api';
import { CartItemDto } from '../../types/cart';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number, quantity: number) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    if (onAddToCart) {
      onAddToCart(product.id, quantity);
      return;
    }

    setIsLoading(true);
    try {
      const cartItem: CartItemDto = {
        productId: product.id,
        quantity
      };
      await cart.addToCart(cartItem);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {product.imageUrl && (
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-gray-600 mt-1">${product.price.toFixed(2)}</p>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              className="px-2 py-1 border rounded-l"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
            >
              -
            </button>
            <span className="px-4 py-1 border-t border-b">{quantity}</span>
            <button 
              className="px-2 py-1 border rounded-r"
              onClick={() => setQuantity(prev => Math.min(product.stockQuantity, prev + 1))}
            >
              +
            </button>
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            onClick={handleAddToCart}
            disabled={isLoading || product.stockQuantity < 1}
          >
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {product.stockQuantity > 0 
            ? `${product.stockQuantity} in stock` 
            : 'Out of stock'}
        </p>
      </div>
    </div>
  );
} 