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
      
      const needsEnrichment = rawData.items.some(
        item => !item.productName && !item.name && !item.unitPrice && !item.price
      );
      
      if (!needsEnrichment) {
        const normalizedItems: CartItemType[] = (rawData.items || []).map(item => ({
          productId: item.productId,
          productName: item.productName || item.name || 'Unknown Product',
          quantity: item.quantity,
          unitPrice: item.unitPrice || item.price || 0,
          totalPrice: item.totalPrice || (item.quantity * (item.unitPrice || item.price || 0)) || 0
        }));
        
        setEnrichedItems(normalizedItems);
        return;
      }
      
      const enrichedItemsPromises = rawData.items.map(async (item) => {
        try {
          if (!item.productName && !item.name && !item.unitPrice && !item.price) {
            const productResponse = await products.getProductById(item.productId);
            const productData = productResponse.data;
            
            return {
              productId: item.productId,
              productName: productData.name || 'Unknown Product',
              quantity: item.quantity,
              unitPrice: productData.price || 0,
              totalPrice: item.quantity * (productData.price || 0)
            };
          } else {
            return {
              productId: item.productId,
              productName: item.productName || item.name || 'Unknown Product',
              quantity: item.quantity,
              unitPrice: item.unitPrice || item.price || 0,
              totalPrice: item.totalPrice || (item.quantity * (item.unitPrice || item.price || 0)) || 0
            };
          }
        } catch (error) {
          console.error(`Error fetching details for product ${item.productId}:`, error);
          return {
            productId: item.productId,
            productName: 'Unknown Product',
            quantity: item.quantity,
            unitPrice: 0,
            totalPrice: 0
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
                {safeCartData.items.map((item) => (
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
              cartData={safeCartData} 
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