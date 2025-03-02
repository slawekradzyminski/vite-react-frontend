export interface CartItem {
  productId: number;
  quantity: number;
  productName: string;
  unitPrice: number;
  totalPrice: number;
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