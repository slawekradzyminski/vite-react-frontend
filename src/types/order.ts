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
  /** VAT breakdown; absent in responses from backends that predate VAT (3.15.0). */
  netAmount?: number | null;
  taxAmount?: number | null;
  taxRate?: number | null;
  taxCountry?: string | null;
  /** Gift card and loyalty points tenders; absent when the order used none. */
  giftCardCode?: string | null;
  giftCardAmount?: number | null;
  pointsRedeemed?: number | null;
  pointsAmount?: number | null;
  /** What the card has to pay: totalAmount minus gift card and points. */
  amountDue?: number | null;
  refundedAmount?: number | null;
  /** When the stock reservation of a PENDING order ends (backend 3.21.0); absent for orders without one. */
  reservationExpiresAt?: string | null;
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