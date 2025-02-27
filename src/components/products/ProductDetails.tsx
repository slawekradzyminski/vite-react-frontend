import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { products, cart } from '../../lib/api';
import { CartItemDto } from '../../types/cart';

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => products.getProductById(Number(id)),
    enabled: !!id,
  });

  const handleAddToCart = async () => {
    if (!product?.data) return;
    
    setIsAddingToCart(true);
    try {
      const cartItem: CartItemDto = {
        productId: product.data.id,
        quantity
      };
      await cart.addToCart(cartItem);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    } finally {
      setIsAddingToCart(false);
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
          </div>
          
          {productData.stockQuantity > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Quantity</h2>
              <div className="flex items-center">
                <button 
                  className="px-3 py-2 border rounded-l"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
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
          
          <button
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            onClick={handleAddToCart}
            disabled={isAddingToCart || productData.stockQuantity < 1}
          >
            {isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
          </button>
          
          {addedToCart && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg">
              Item added to cart successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 