import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { cart, products } from '../../lib/api';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { Cart as CartType, CartItem as CartItemType } from '../../types/cart';
import { Surface } from '../ui/surface';

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
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="cart-loading">Loading cart...</Surface>;
  }
  
  if (error) {
    return (
      <Surface variant="danger" padding="message" className="text-center" data-testid="cart-error">
        <p className="mb-4 text-red-600">Error loading cart</p>
        <button
          onClick={() => refetch()}
          className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
          data-testid="cart-retry"
        >
          Try again
        </button>
      </Surface>
    );
  }
  
  const derivedTotalItems = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);
  const derivedTotalPrice = enrichedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const safeCartData: CartType = {
    items: enrichedItems,
    totalPrice: rawData?.totalPrice ?? rawData?.totalAmount ?? derivedTotalPrice,
    username: rawData?.username || '',
    totalItems: rawData?.totalItems ?? derivedTotalItems,
  };
  
  const isEmpty = safeCartData.items.length === 0;
  
  return (
    <div className="space-y-6 pb-10" data-testid="cart-page">
      <Surface as="section" variant="hero" padding="xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Cart</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="cart-title">Your Cart</h1>
          </div>
          <Link
            to="/products"
            className="w-fit rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
            data-testid="cart-continue-shopping"
          >
            Continue Shopping
          </Link>
        </div>
      </Surface>

      {isEmpty ? (
        <Surface variant="default" className="p-10 text-center" data-testid="cart-empty">
          <p className="mb-4 text-slate-600">Your cart is empty</p>
          <Link
            to="/products"
            className="inline-block rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
            data-testid="cart-browse-products"
          >
            Browse Products
          </Link>
        </Surface>
      ) : (
        <div className="space-y-6" data-testid="cart-content">
          <Surface variant="default" className="overflow-hidden" data-testid="cart-summary-container">
            <CartSummary
              cartData={safeCartData}
              onUpdate={handleCartUpdate}
            />
          </Surface>

          <Surface variant="default" className="overflow-hidden" data-testid="cart-items-container">
            <div className="border-b border-stone-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-950" data-testid="cart-items-heading">Cart Items</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200" data-testid="cart-items-table">
                <thead className="bg-stone-50/80">
                  <tr>
                    <th className="w-2/5 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white/60 space-y-0" data-testid="cart-items-list">
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
          </Surface>
        </div>
      )}
    </div>
  );
}
