import { useEffect, useMemo, useState } from 'react';
import type { Cart, CartItem } from '../types/cart';
import { products } from '../lib/api';

interface RawCartItem {
  productId: number;
  productName?: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  totalPrice?: number;
  imageUrl?: string;
}

export interface RawCartResponse {
  items?: RawCartItem[];
  totalPrice?: number;
  totalAmount?: number;
  username?: string;
  totalItems?: number;
}

const fallbackPrice = (item: RawCartItem, productPrice = 0) =>
  item.unitPrice ?? item.price ?? productPrice;

const enrichCartItem = async (item: RawCartItem): Promise<CartItem> => {
  try {
    const productResponse = await products.getProductById(item.productId);
    const productData = productResponse.data;
    const unitPrice = fallbackPrice(item, productData.price);

    return {
      productId: item.productId,
      productName: item.productName ?? item.name ?? productData.name ?? 'Unknown Product',
      quantity: item.quantity,
      unitPrice,
      totalPrice: item.totalPrice ?? item.quantity * unitPrice,
      imageUrl: item.imageUrl ?? productData.imageUrl ?? '',
    };
  } catch (error) {
    console.error(`Error fetching details for product ${item.productId}:`, error);
    const unitPrice = fallbackPrice(item);

    return {
      productId: item.productId,
      productName: item.productName ?? item.name ?? 'Unknown Product',
      quantity: item.quantity,
      unitPrice,
      totalPrice: item.totalPrice ?? item.quantity * unitPrice,
      imageUrl: item.imageUrl ?? '',
    };
  }
};

const getRawItemSignature = (item: RawCartItem) =>
  `${item.productId}:${item.quantity}:${item.unitPrice ?? item.price ?? ''}:${item.totalPrice ?? ''}`;

export function useEnrichedCart(rawData?: RawCartResponse) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedSourceSignature, setEnrichedSourceSignature] = useState('');
  const rawItems = rawData?.items ?? [];
  const needsEnrichment = rawItems.length > 0;
  const rawItemsSignature = rawItems.map(getRawItemSignature).join('|');
  const hasPendingItems = needsEnrichment && rawItemsSignature !== enrichedSourceSignature;

  useEffect(() => {
    let isActive = true;

    const enrichItems = async () => {
      const currentRawItems = rawData?.items ?? [];
      if (!needsEnrichment) {
        setItems([]);
        setEnrichedSourceSignature('');
        setIsEnriching(false);
        return;
      }

      setIsEnriching(true);
      const resolvedItems = await Promise.all(currentRawItems.map(enrichCartItem));

      if (isActive) {
        setItems(resolvedItems);
        setEnrichedSourceSignature(rawItemsSignature);
        setIsEnriching(false);
      }
    };

    enrichItems();

    return () => {
      isActive = false;
    };
  }, [rawData, needsEnrichment, rawItemsSignature]);

  const cartData = useMemo<Cart>(() => {
    const derivedTotalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const derivedTotalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      items,
      totalPrice: rawData?.totalPrice ?? rawData?.totalAmount ?? derivedTotalPrice,
      username: rawData?.username ?? '',
      totalItems: rawData?.totalItems ?? derivedTotalItems,
    };
  }, [items, rawData]);

  return {
    cartData,
    isEnriching: isEnriching || hasPendingItems,
  };
}
