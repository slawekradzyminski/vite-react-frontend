// Types for the coupon, review, wishlist, fulfilment, returns and purchasing APIs.
// They alias the generated OpenAPI schemas directly, so they cannot drift from the backend.
import type { components } from './generated/backend-api';

type Schemas = components['schemas'];

export type Coupon = Schemas['CouponDto'];
export type CouponRequest = Schemas['CouponRequestDto'];
export type CouponType = NonNullable<CouponRequest['type']>;
export type CouponStatus = NonNullable<Coupon['status']>;
export type CartWithCoupon = Schemas['CartDto'];

export type Review = Schemas['ReviewDto'];
export type ReviewRequest = Schemas['ReviewRequestDto'];
export type ReviewStatus = NonNullable<Review['status']>;
export type MyReview = Schemas['MyReviewDto'];
export type ReviewSummary = Schemas['ReviewSummaryDto'];
export type ModerationRequest = Schemas['ModerationRequestDto'];

export type WishlistItem = Schemas['WishlistItemDto'];

export type ImportReport = Schemas['ImportReportDto'];
export type ImportRowError = Schemas['ImportRowErrorDto'];

export type Shipment = Schemas['ShipmentDto'];
export type ShipmentStatus = NonNullable<Shipment['status']>;
export type Carrier = NonNullable<Schemas['ShipShipmentDto']['carrier']>;
export type PickList = Schemas['PickListDto'];

export type ReturnRequest = Schemas['ReturnDto'];
export type ReturnStatus = NonNullable<ReturnRequest['status']>;
export type ReturnReason = NonNullable<Schemas['CreateReturnDto']['reason']>;
export type CreateReturnRequest = Schemas['CreateReturnDto'];
export type ItemCondition = NonNullable<Schemas['ReceiveItemDto']['condition']>;

export type Supplier = Schemas['SupplierDto'];
export type SupplierRequest = Schemas['SupplierRequestDto'];
export type PurchaseOrder = Schemas['PurchaseOrderDto'];
export type PurchaseOrderStatus = NonNullable<PurchaseOrder['status']>;
export type PurchaseOrderRequest = Schemas['PurchaseOrderRequestDto'];
export type ReceiptRequest = Schemas['ReceiptRequestDto'];
export type ReorderSuggestion = Schemas['ReorderSuggestionDto'];

export interface Page<T> {
  content?: T[];
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
}

export const CARRIER_FORMATS: Record<Carrier, { pattern: RegExp; hint: string }> = {
  INPOST: { pattern: /^\d{24}$/, hint: '24 digits' },
  DPD: { pattern: /^\d{14}$/, hint: '14 digits' },
  DHL: { pattern: /^\d{10}$/, hint: '10 digits' },
  UPS: { pattern: /^1Z[A-Z0-9]{16}$/, hint: '1Z followed by 16 letters or digits' },
};
