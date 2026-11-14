// Types for the coupon, review, wishlist, fulfilment, returns, purchasing, tracking, search, tax,
// currency, gift card, loyalty and webhook APIs.
// They alias the generated OpenAPI schemas directly, so they cannot drift from the service
// that owns them: coupons, reviews, wishlist, CSV import, product search, VAT, currencies, gift
// cards and loyalty come from the backend; shipments, parcels, warehouse locations, tracking,
// returns, suppliers, purchase orders and reorder suggestions come from warehouse-service;
// webhooks come from notification-service. Payments live in ./payment (payment-service) and
// commerce emails in ./notification.
import type { components, operations } from './generated/backend-api';
import type { components as warehouseComponents } from './generated/warehouse-api';
import type { components as notificationComponents } from './generated/notification-api';

type Schemas = components['schemas'];
type WarehouseSchemas = warehouseComponents['schemas'];
type NotificationSchemas = notificationComponents['schemas'];

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

export type Shipment = WarehouseSchemas['ShipmentDto'];
export type ShipmentStatus = NonNullable<Shipment['status']>;
export type Carrier = NonNullable<WarehouseSchemas['ShipShipmentDto']['carrier']>;
export type PickList = WarehouseSchemas['PickListDto'];
export type ShipmentLine = WarehouseSchemas['ShipmentLineDto'];
export type WarehouseLocation = WarehouseSchemas['WarehouseLocationDto'];
export type Reallocation = WarehouseSchemas['ReallocateShipmentDto'];
export type ShortPickRequest = WarehouseSchemas['ShortPickDto'];
export type ReconciliationEntry = WarehouseSchemas['ReconciliationDto'];

export type Tracking = WarehouseSchemas['TrackingDto'];
export type PublicTracking = WarehouseSchemas['PublicTrackingDto'];
export type TrackingEvent = WarehouseSchemas['TrackingEventDto'];
export type TrackingStatus = NonNullable<TrackingEvent['status']>;

export type ReturnRequest = WarehouseSchemas['ReturnDto'];
export type ReturnStatus = NonNullable<ReturnRequest['status']>;
export type ReturnReason = NonNullable<WarehouseSchemas['CreateReturnDto']['reason']>;
export type CreateReturnRequest = WarehouseSchemas['CreateReturnDto'];
export type ItemCondition = NonNullable<WarehouseSchemas['ReceiveItemDto']['condition']>;

export type Supplier = WarehouseSchemas['SupplierDto'];
export type SupplierRequest = WarehouseSchemas['SupplierRequestDto'];
export type PurchaseOrder = WarehouseSchemas['PurchaseOrderDto'];
export type PurchaseOrderStatus = NonNullable<PurchaseOrder['status']>;
export type PurchaseOrderRequest = WarehouseSchemas['PurchaseOrderRequestDto'];
export type ReceiptRequest = WarehouseSchemas['ReceiptRequestDto'];
export type ReorderSuggestion = WarehouseSchemas['ReorderSuggestionDto'];

export type ProductSearchResult = Schemas['ProductSearchResultDto'];
export type ProductSearchItem = Schemas['ProductSearchItemDto'];
export type ProductSearchFacets = Schemas['ProductSearchFacetsDto'];
export type CategoryFacet = Schemas['CategoryFacetDto'];
export type PriceRangeFacet = Schemas['PriceRangeFacetDto'];
export type ProductSearchParams = NonNullable<operations['search']['parameters']['query']>;
export type ProductSearchSort = NonNullable<ProductSearchParams['sort']>;

export type VatRate = Schemas['VatRateDto'];
export type VatRateRequest = Schemas['VatRateRequestDto'];
export type TaxPreview = Schemas['TaxPreviewDto'];

export type Currency = Schemas['CurrencyDto'];
export type CurrencyRequest = Schemas['CurrencyRequestDto'];
export type CurrencyConversion = Schemas['CurrencyConversionDto'];

export type GiftCard = Schemas['GiftCardDto'];
export type GiftCardStatus = NonNullable<GiftCard['status']>;
export type GiftCardBalance = Schemas['GiftCardBalanceDto'];
export type GiftCardCreateRequest = Schemas['GiftCardCreateDto'];
export type GiftCardTransaction = Schemas['GiftCardTransactionDto'];

export type LoyaltyAccount = Schemas['LoyaltyAccountDto'];
export type LoyaltyTier = NonNullable<LoyaltyAccount['tier']>;
export type LoyaltyTransaction = Schemas['LoyaltyTransactionDto'];

export type WebhookSubscription = NotificationSchemas['WebhookSubscriptionDto'];
export type WebhookCreateRequest = NotificationSchemas['WebhookCreateDto'];
export type WebhookUpdateRequest = NotificationSchemas['WebhookUpdateDto'];
export type WebhookDelivery = NotificationSchemas['WebhookDeliveryDto'];
export type WebhookDeliveryStatus = NonNullable<WebhookDelivery['status']>;
export type WebhookEventType = NotificationSchemas['WebhookEventTypeDto'];
export type WebhookInbox = NotificationSchemas['WebhookInboxDto'];
export type WebhookInboxRequest = NotificationSchemas['WebhookInboxRequestDto'];

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
