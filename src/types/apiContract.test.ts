// Compile-time contract between the hand-written API types and the backend, warehouse-service and
// payment-service OpenAPI snapshots.
// `npm run typecheck` fails here when a backend change renames, removes, or retypes a field
// the frontend relies on; the runtime test only keeps Vitest from reporting an empty file.
import type { components } from './generated/backend-api';
import type { components as warehouseComponents } from './generated/warehouse-api';
import type { components as paymentComponents } from './generated/payment-api';
import type { RawCartResponse } from '../hooks/useEnrichedCart';
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  MfaChallengeRequest,
  MfaCodeRequest,
  MfaProtectedActionRequest,
  MfaRecoveryCodesResponse,
  MfaSetupResponse,
  MfaStatusResponse,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  Role,
  TokenPair,
  User,
  UserEditDTO,
} from './auth';
import type { CartItemDto, UpdateCartItemDto } from './cart';
import type {
  CurrencyConversion,
  GiftCard,
  GiftCardBalance,
  LoyaltyAccount,
  LoyaltyTransaction,
  ProductSearchResult,
  PublicTracking,
  TaxPreview,
  Tracking,
  VatRate,
  WebhookDelivery,
  WebhookInbox,
  WebhookSubscription,
} from './commerce';
import type { EmailDto } from './email';
import type { InventoryAdjustmentRequest, InventoryItem, InventoryMovement, PageDto } from './inventory';
import type { ChatRequestDto, GenerateRequestDto, OllamaToolDefinition } from './ollama';
import type { Address, AddressDto, FulfilmentState, Order, OrderItem, PageDtoOrderDto } from './order';
import type { Product, ProductCreateDto, ProductUpdateDto } from './product';
import type { ChatSystemPromptDto, ToolSystemPromptDto } from './prompts';
import type { CreatePaymentRequest, Payment, PaymentPage, ThreeDsRequest } from './payment';
import type { CreateQrDto } from './qr';
import type { TrafficInfoDto } from './traffic';

type Schemas = components['schemas'];
type WarehouseSchemas = warehouseComponents['schemas'];
type PaymentSchemas = paymentComponents['schemas'];

// springdoc marks few response fields as required, so a response is compared as if the
// backend always sends every field it declares; nulls are left to the frontend's own guards.
type Sent<T> = T extends (infer Item)[]
  ? Sent<Item>[]
  : T extends object
    ? { [K in keyof T]-?: Sent<NonNullable<T[K]>> }
    : T;

// Enum members are compared by value so `Role.ADMIN` matches the backend's 'ROLE_ADMIN'.
type Value<T> = T extends string ? `${T}` : T extends (infer Item)[] ? Value<Item>[] : T;

// The tool catalog narrows strings the backend declares as plain `string` to the values it uses.
type WidenedLiterals<T> = T extends string
  ? string
  : T extends (infer Item)[]
    ? WidenedLiterals<Item>[]
    : T extends object
      ? { [K in keyof T]: WidenedLiterals<T[K]> }
      : T;

type RequiredKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? never : K }[keyof T];

// Fields the frontend reads that the backend does not send, or sends with another type.
type ResponseViolations<Frontend, Backend> =
  | Exclude<keyof Frontend, keyof Backend>
  | {
      [K in keyof Frontend & keyof Backend]-?: Value<Sent<NonNullable<Backend[K]>>> extends Value<NonNullable<Frontend[K]>>
        ? never
        : K;
    }[keyof Frontend & keyof Backend];

// Fields the frontend sends that the backend does not accept, sends with another type,
// or may leave out although the backend requires them.
type RequestViolations<Frontend, Backend> =
  | Exclude<keyof Frontend, keyof Backend>
  | { [K in RequiredKeys<Backend>]: K extends RequiredKeys<Frontend> ? never : K }[RequiredKeys<Backend>]
  | {
      [K in keyof Frontend & keyof Backend]-?: Value<NonNullable<Frontend[K]>> extends Value<NonNullable<Backend[K]>>
        ? never
        : K;
    }[keyof Frontend & keyof Backend];

describe('backend API contract', () => {
  it('flags each kind of violation', () => {
    type BackendResponse = { id: number; role: 'ROLE_ADMIN' | 'ROLE_CLIENT' };
    expectTypeOf<ResponseViolations<{ id: number; nickname: string }, BackendResponse>>().toEqualTypeOf<'nickname'>();
    expectTypeOf<ResponseViolations<{ id: string }, BackendResponse>>().toEqualTypeOf<'id'>();
    expectTypeOf<ResponseViolations<{ role: Role }, BackendResponse>>().toEqualTypeOf<never>();

    type BackendRequest = { email: string; firstName?: string };
    expectTypeOf<RequestViolations<{ email: string; roles: Role[] }, BackendRequest>>().toEqualTypeOf<'roles'>();
    expectTypeOf<RequestViolations<{ firstName: string }, BackendRequest>>().toEqualTypeOf<'email'>();
    expectTypeOf<RequestViolations<{ email?: string }, BackendRequest>>().toEqualTypeOf<'email'>();
    expectTypeOf<RequestViolations<{ email: number }, BackendRequest>>().toEqualTypeOf<'email'>();
  });

  it('reads only fields the backend sends', () => {
    expectTypeOf<ResponseViolations<User, Schemas['UserResponseDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<LoginResponse, Schemas['LoginResponseDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<TokenPair, Schemas['TokenRefreshResponseDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<MfaStatusResponse, Schemas['MfaStatusResponseDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<MfaSetupResponse, Schemas['MfaSetupResponseDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<MfaRecoveryCodesResponse, Schemas['MfaRecoveryCodesResponseDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<ForgotPasswordResponse, Schemas['ForgotPasswordResponseDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<Product, Schemas['ProductDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<Order, Schemas['OrderDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<OrderItem, Schemas['OrderItemDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<Address, Schemas['AddressDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<PageDtoOrderDto, Schemas['PageDtoOrderDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<InventoryItem, Schemas['InventoryItemDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<InventoryMovement, Schemas['InventoryMovementDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<PageDto<InventoryItem>, Schemas['PageDtoInventoryItemDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<PageDto<InventoryMovement>, Schemas['PageDtoInventoryMovementDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<TrafficInfoDto, Schemas['TrafficInfoDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<ChatSystemPromptDto, Schemas['ChatSystemPromptDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<ToolSystemPromptDto, Schemas['ToolSystemPromptDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<WidenedLiterals<OllamaToolDefinition>, Schemas['OllamaToolDefinitionDto']>>().toEqualTypeOf<never>();
  });

  it('accepts the cart payload the backend sends before enrichment', () => {
    // Cart and CartItem are view models built by useEnrichedCart, not wire types.
    expectTypeOf<Sent<Schemas['CartDto']>>().toExtend<RawCartResponse>();
  });

  it('sends only fields the backend accepts', () => {
    expectTypeOf<RequestViolations<LoginRequest, Schemas['LoginDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<RegisterRequest, Schemas['UserRegisterDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<UserEditDTO, Schemas['UserEditDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<RefreshTokenRequest, Schemas['RefreshTokenRequestDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<ForgotPasswordRequest, Schemas['ForgotPasswordRequestDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<ResetPasswordRequest, Schemas['ResetPasswordRequestDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<MfaChallengeRequest, Schemas['MfaChallengeRequestDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<MfaCodeRequest, Schemas['MfaCodeRequestDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<MfaProtectedActionRequest, Schemas['MfaProtectedActionRequestDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<CartItemDto, Schemas['CartItemDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<UpdateCartItemDto, Schemas['UpdateCartItemDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<ProductCreateDto, Schemas['ProductCreateDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<ProductUpdateDto, Schemas['ProductUpdateDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<AddressDto, Schemas['AddressDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<InventoryAdjustmentRequest, Schemas['InventoryAdjustmentDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<EmailDto, Schemas['EmailDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<CreateQrDto, Schemas['CreateQrDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<ChatRequestDto, Schemas['ChatRequestDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<GenerateRequestDto, Schemas['StreamedRequestDto']>>().toEqualTypeOf<never>();
  });

  it('reads only fields warehouse-service sends', () => {
    // The warehouse queue returns orders in the same page shape as the backend.
    expectTypeOf<ResponseViolations<PageDtoOrderDto, WarehouseSchemas['PageDtoOrderDto']>>().toEqualTypeOf<never>();
  });

  it('reads only fields warehouse-service sends for tracking', () => {
    expectTypeOf<ResponseViolations<Tracking, WarehouseSchemas['TrackingDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<PublicTracking, WarehouseSchemas['PublicTrackingDto']>>().toEqualTypeOf<never>();
  });

  it('reads only fields the backend sends for search, tax, currencies, gift cards, loyalty and webhooks', () => {
    expectTypeOf<ResponseViolations<ProductSearchResult, Schemas['ProductSearchResultDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<VatRate, Schemas['VatRateDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<TaxPreview, Schemas['TaxPreviewDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<CurrencyConversion, Schemas['CurrencyConversionDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<GiftCard, Schemas['GiftCardDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<GiftCardBalance, Schemas['GiftCardBalanceDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<LoyaltyAccount, Schemas['LoyaltyAccountDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<LoyaltyTransaction, Schemas['LoyaltyTransactionDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<WebhookSubscription, Schemas['WebhookSubscriptionDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<WebhookDelivery, Schemas['WebhookDeliveryDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<WebhookInbox, Schemas['WebhookInboxDto']>>().toEqualTypeOf<never>();
  });

  it('reads only fields payment-service sends and sends only fields it accepts', () => {
    expectTypeOf<ResponseViolations<Payment, PaymentSchemas['PaymentDto']>>().toEqualTypeOf<never>();
    expectTypeOf<ResponseViolations<PaymentPage, PaymentSchemas['PageDtoPaymentDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<CreatePaymentRequest, PaymentSchemas['CreatePaymentDto']>>().toEqualTypeOf<never>();
    expectTypeOf<RequestViolations<ThreeDsRequest, PaymentSchemas['ThreeDsDto']>>().toEqualTypeOf<never>();
  });

  it('tracks the backend fulfilment state values', () => {
    expectTypeOf<NonNullable<Schemas['OrderDto']['fulfilmentState']>>().toEqualTypeOf<FulfilmentState>();
  });
});
