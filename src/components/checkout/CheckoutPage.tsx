import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { cart, products } from '../../lib/api';
import { CheckoutForm } from './CheckoutForm';
import { CartItem as CartItemType } from '../../types/cart';

interface RawCartResponse {
  items?: Array<{
    productId: number;
    productName?: string;
    name?: string;
    quantity: number;
    unitPrice?: number;
    price?: number;
    totalPrice?: number;
  }>;
  totalPrice?: number;
  totalAmount?: number;
  username?: string;
  totalItems?: number;
}

export function CheckoutPage() {
  const [enrichedItems, setEnrichedItems] = useState<CartItemType[]>([]);
  
  const { data: cartResponse, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: cart.getCart,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  const rawData = cartResponse?.data as RawCartResponse;
  
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!rawData?.items) return;
      
      const enrichedItemsPromises = rawData.items.map(async (item) => {
        try {
          const productResponse = await products.getProductById(item.productId);
          const productData = productResponse.data;
          
          return {
            productId: item.productId,
            productName: item.productName || item.name || productData.name || 'Unknown Product',
            quantity: item.quantity,
            unitPrice: item.unitPrice || item.price || productData.price || 0,
            totalPrice: item.totalPrice || (item.quantity * (item.unitPrice || item.price || productData.price || 0)) || 0,
            imageUrl: productData.imageUrl || ''
          };
        } catch (error) {
          console.error(`Error fetching details for product ${item.productId}:`, error);
          return {
            productId: item.productId,
            productName: item.productName || item.name || 'Unknown Product',
            quantity: item.quantity,
            unitPrice: item.unitPrice || item.price || 0,
            totalPrice: item.totalPrice || (item.quantity * (item.unitPrice || item.price || 0)) || 0,
            imageUrl: ''
          };
        }
      });
      
      const resolvedItems = await Promise.all(enrichedItemsPromises);
      setEnrichedItems(resolvedItems);
    };
    
    if (rawData?.items) {
      fetchProductDetails();
    }
  }, [rawData]);

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
  if (!rawData?.items || rawData.items.length === 0) {
    return <Navigate to="/cart" />;
  }

  const totalPrice = rawData?.totalPrice || rawData?.totalAmount || 0;
  const totalItems = rawData?.totalItems || enrichedItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <Link
          to="/cart"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          ← Back to Cart
        </Link>
      </div>
      
      <div className="space-y-6">
        {/* Checkout Form */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Shipping Information</h2>
          </div>
          <div className="p-6">
            <CheckoutForm cartTotal={totalPrice} />
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Order Summary</h2>
          </div>
          <div className="p-6 border-b border-gray-200">
            <div className="flex space-x-6">
              <div>
                <span className="text-sm font-medium text-gray-500 uppercase block">Items</span>
                <span className="text-lg">{totalItems}</span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500 uppercase block">Total</span>
                <span className="text-xl font-bold">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Cart Items */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 space-y-0">
              {enrichedItems.map((item) => (
                <tr key={item.productId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.imageUrl && (
                        <div className="flex-shrink-0 h-12 w-12 mr-4">
                          <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={item.imageUrl}
                            alt={item.productName}
                          />
                        </div>
                      )}
                      <div>
                        <span className="font-medium">{item.productName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${item.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 