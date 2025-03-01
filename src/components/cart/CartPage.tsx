import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { cart } from '../../lib/api';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';

export function CartPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { data: cartData, isLoading, error, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: cart.getCart,
  });
  
  const handleCartUpdate = async () => {
    setIsUpdating(true);
    try {
      await refetch();
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (isLoading || isUpdating) {
    return <div className="text-center py-8">Loading cart...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error loading cart</p>
        <button 
          onClick={() => refetch()} 
          className="text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }
  
  const { items = [], totalPrice = 0 } = cartData?.data || {};
  const isEmpty = items.length === 0;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      
      {isEmpty ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link 
            to="/products" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Cart Items</h2>
              
              <div className="space-y-6">
                {items.map((item) => (
                  <CartItem 
                    key={item.productId} 
                    item={item} 
                    onUpdate={handleCartUpdate} 
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <CartSummary 
              cartData={{ 
                items, 
                totalPrice, 
                username: cartData?.data?.username || '',
                totalItems
              }} 
              onUpdate={handleCartUpdate} 
            />
            
            <div className="mt-6">
              <Link 
                to="/products" 
                className="block text-center text-blue-600 hover:underline mb-4"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 