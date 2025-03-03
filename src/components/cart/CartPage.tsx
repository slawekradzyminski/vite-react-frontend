import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { cart, products } from '../../lib/api';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { Cart as CartType, CartItem as CartItemType } from '../../types/cart';

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

export function CartPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [enrichedItems, setEnrichedItems] = useState<CartItemType[]>([]);
  
  const { data: cartResponse, isLoading, error, refetch } = useQuery({
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
  
  const handleCartUpdate = async () => {
    setIsUpdating(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refetching cart:', error);
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
  
  const safeCartData: CartType = {
    items: enrichedItems,
    totalPrice: rawData?.totalPrice || rawData?.totalAmount || 0,
    username: rawData?.username || '',
    totalItems: rawData?.totalItems || enrichedItems.reduce((sum, item) => sum + item.quantity, 0)
  };
  
  const isEmpty = safeCartData.items.length === 0;
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <Link
          to="/products"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
      
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
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <CartSummary 
              cartData={safeCartData} 
              onUpdate={handleCartUpdate} 
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Cart Items</h2>
            </div>
            
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 space-y-0">
                {safeCartData.items.map((item) => (
                  <CartItem 
                    key={item.productId} 
                    item={item} 
                    onUpdate={handleCartUpdate} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 