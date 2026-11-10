// Types for card payments. They alias the generated payment-service OpenAPI schemas directly,
// so they cannot drift from the service that owns them.
import type { components } from './generated/payment-api';

type PaymentSchemas = components['schemas'];

export type Payment = PaymentSchemas['PaymentDto'];
export type PaymentStatus = NonNullable<Payment['status']>;
export type CardBrand = NonNullable<Payment['cardBrand']>;
export type PaymentNextAction = PaymentSchemas['NextActionDto'];
export type PaymentCard = PaymentSchemas['CardDto'];
export type CreatePaymentRequest = PaymentSchemas['CreatePaymentDto'];
export type ThreeDsRequest = PaymentSchemas['ThreeDsDto'];
export type PaymentPage = PaymentSchemas['PageDtoPaymentDto'];
