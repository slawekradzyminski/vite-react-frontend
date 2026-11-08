export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  productName: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  username: string;
  items: OrderItem[];
  totalAmount: number;
  /** Absent in responses from backends that predate coupons. */
  subtotalAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
  status: OrderStatus;
  /** Absent in responses from backends that predate warehouse-service. */
  fulfilmentState?: FulfilmentState;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type FulfilmentState =
  | 'NONE'
  | 'AWAITING_PICK'
  | 'PICKED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface AddressDto {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PageDtoOrderDto {
  content: Order[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
} 