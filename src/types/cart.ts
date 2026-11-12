export interface CartItem {
  productId: number;
  quantity: number;
  productName: string;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  // Current product stock, when the cart source provides it.
  stockQuantity?: number;
  // Set when the product price changed after the line was added or updated: unitPrice is
  // what checkout charges, currentPrice is what updating the line would take.
  priceChanged?: boolean;
  currentPrice?: number;
}

export interface Cart {
  username: string;
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}

export interface CartItemDto {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
} 