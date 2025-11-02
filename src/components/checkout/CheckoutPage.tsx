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
    return <div className="text-center py-8" data-testid="checkout-loading">Loading checkout...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8" data-testid="checkout-error">
        <p className="text-red-500 mb-4">Error loading cart data</p>
        <Link to="/cart" className="text-blue-600 hover:underline" data-testid="checkout-back-to-cart">
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
    <div className="max-w-6xl mx-auto p-4" data-testid="checkout-page">
      <div className="flex justify-between items-center mb-6" data-testid="checkout-header">
        <h1 className="text-2xl font-bold" data-testid="checkout-title">Checkout</h1>
        <Link
          to="/cart"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          data-testid="checkout-back-button"
        >
          ← Back to Cart
        </Link>
      </div>
      
      <div className="space-y-6" data-testid="checkout-content">
        {/* Checkout Form */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" data-testid="checkout-form-section">
          <div className="px-6 py-4 border-b border-gray-200" data-testid="checkout-form-header">
            <h2 className="text-lg font-semibold" data-testid="checkout-shipping-title">Shipping Information</h2>
          </div>
          <div className="p-6" data-testid="checkout-form-container">
            <CheckoutForm cartTotal={totalPrice} />
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" data-testid="checkout-summary-section">
          <div className="px-6 py-4 border-b border-gray-200" data-testid="checkout-summary-header">
            <h2 className="text-lg font-semibold" data-testid="checkout-summary-title">Order Summary</h2>
          </div>
          <div className="p-6 border-b border-gray-200" data-testid="checkout-summary-info">
            <div className="flex space-x-6" data-testid="checkout-summary-counts">
              <div data-testid="checkout-items-count">
                <span className="text-sm font-medium text-gray-500 uppercase block">Items</span>
                <span className="text-lg" data-testid="checkout-items-value">{totalItems}</span>
              </div>
              
              <div data-testid="checkout-total">
                <span className="text-sm font-medium text-gray-500 uppercase block">Total</span>
                <span className="text-xl font-bold" data-testid="checkout-total-value">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Cart Items */}
          <table className="min-w-full divide-y divide-gray-200" data-testid="checkout-items-table">
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
            <tbody className="bg-white divide-y divide-gray-200 space-y-0" data-testid="checkout-items-list">
              {enrichedItems.map((item) => (
                <tr key={item.productId} data-testid={`checkout-item-${item.productId}`}>
                  <td className="px-6 py-4 whitespace-nowrap" data-testid={`checkout-item-product-${item.productId}`}>
                    <div className="flex items-center">
                      {item.imageUrl && (
                        <div className="shrink-0 h-12 w-12 mr-4">
                          <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={item.imageUrl}
                            alt={item.productName}
                            data-testid={`checkout-item-image-${item.productId}`}
                          />
                        </div>
                      )}
                      <div>
                        <span className="font-medium" data-testid={`checkout-item-name-${item.productId}`}>{item.productName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`checkout-item-price-${item.productId}`}>
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`checkout-item-quantity-${item.productId}`}>
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-testid={`checkout-item-total-${item.productId}`}>
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