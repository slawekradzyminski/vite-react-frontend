import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { cart } from '../../lib/api';
import { CheckoutForm } from './CheckoutForm';
import { CartItem } from '../cart/CartItem';

export function CheckoutPage() {
  const { data: cartData, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: cart.getCart,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading checkout...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error loading cart data</p>
        <Link to="/cart" className="text-blue-600 hover:underline">
          Back to Cart
        </Link>
      </div>
    );
  }

  // Redirect to cart if cart is empty
  if (!cartData?.data?.items || cartData.data.items.length === 0) {
    return <Navigate to="/cart" />;
  }

  const { items, totalAmount } = cartData.data;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h3 className="font-medium">{item.productName}</h3>
                    <p className="text-gray-600">
                      ${item.unitPrice.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-6 lg:hidden">
            <Link to="/cart" className="text-blue-600 hover:underline">
              ← Back to Cart
            </Link>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <CheckoutForm cartTotal={totalAmount} />
          
          <div className="text-center mt-6 hidden lg:block">
            <Link to="/cart" className="text-blue-600 hover:underline">
              ← Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 