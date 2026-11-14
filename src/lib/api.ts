import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  UserEditDTO,
  RefreshTokenRequest,
  LogoutRequest,
  TokenPair,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  MfaChallengeRequest,
  MfaStatusResponse,
  MfaSetupResponse,
  MfaCodeRequest,
  MfaProtectedActionRequest,
  MfaRecoveryCodesResponse,
} from '../types/auth';
import type { EmailDto, EmailResponse } from '../types/email';
import type { CreateQrDto, QrCodeResponse } from '../types/qr';
import type { GenerateRequestDto, ChatRequestDto, OllamaToolDefinition } from '../types/ollama';
import type { ChatSystemPromptDto, ToolSystemPromptDto } from '../types/prompts';
import type { Order, PageDtoOrderDto, Address, OrderStatus } from '../types/order';
import type { Product, ProductCreateDto, ProductUpdateDto } from '../types/product';
import type { Cart, CartItemDto, UpdateCartItemDto } from '../types/cart';
import type { TrafficInfoDto } from '../types/traffic';
import type {
  InventoryAdjustmentRequest,
  InventoryItem,
  InventoryMovement,
  PageDto,
  StockStatus,
} from '../types/inventory';
import type {
  Carrier,
  CartWithCoupon,
  Coupon,
  CouponRequest,
  CreateReturnRequest,
  Currency,
  CurrencyConversion,
  CurrencyRequest,
  GiftCard,
  GiftCardBalance,
  GiftCardCreateRequest,
  GiftCardStatus,
  ImportReport,
  ItemCondition,
  LoyaltyAccount,
  LoyaltyTransaction,
  ModerationRequest,
  MyReview,
  Page,
  PickList,
  ProductSearchParams,
  ProductSearchResult,
  PublicTracking,
  PurchaseOrder,
  PurchaseOrderRequest,
  PurchaseOrderStatus,
  ReceiptRequest,
  ReorderSuggestion,
  ReturnRequest,
  ReturnStatus,
  Review,
  ReviewRequest,
  ReviewStatus,
  ReviewSummary,
  ReconciliationEntry,
  Shipment,
  ShipmentStatus,
  ShortPickRequest,
  Supplier,
  SupplierRequest,
  TaxPreview,
  Tracking,
  VatRate,
  VatRateRequest,
  WebhookCreateRequest,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEventType,
  WebhookInbox,
  WebhookInboxRequest,
  WebhookSubscription,
  WebhookUpdateRequest,
  WarehouseLocation,
  WishlistItem,
} from '../types/commerce';
import type { CreatePaymentRequest, Payment, PaymentPage, PaymentStatus } from '../types/payment';
import type { NotificationEmailPage } from '../types/notification';
import { authStorage } from './authStorage';
import { commerceTransport } from './commerceTransport';
import { createCommerceGraphql } from './commerceGraphql';
import {
  getAbsoluteApiUrl,
  getApiBaseUrl,
  getNotificationApiBaseUrl,
  getPaymentApiBaseUrl,
  getWarehouseApiBaseUrl,
} from './runtimeConfig';
import { withTrackedWrites } from './pendingWrites';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Shipments, returns, suppliers, purchase orders and reorder suggestions live in
// warehouse-service. It accepts the backend's tokens, so it shares the auth interceptors.
const warehouseApi = axios.create({
  baseURL: getWarehouseApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Card payments live in payment-service, which also accepts the backend's tokens.
const paymentApi = axios.create({
  baseURL: getPaymentApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Webhooks, webhook inboxes and the commerce email log live in notification-service, which
// also accepts the backend's tokens.
const notificationApi = axios.create({
  baseURL: getNotificationApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

const API_V1_PREFIX = '/api/v1';
const USERS_API = `${API_V1_PREFIX}/users`;
const EMAIL_API = `${API_V1_PREFIX}/email`;
const QR_API = `${API_V1_PREFIX}/qr`;
const OLLAMA_API = `${API_V1_PREFIX}/ollama`;
const ORDERS_API = `${API_V1_PREFIX}/orders`;
const PRODUCTS_API = `${API_V1_PREFIX}/products`;
const CART_API = `${API_V1_PREFIX}/cart`;
const TRAFFIC_API = `${API_V1_PREFIX}/traffic`;
const INVENTORY_API = `${API_V1_PREFIX}/admin/inventory`;
const ADMIN_API = `${API_V1_PREFIX}/admin`;
const COUPONS_API = `${ADMIN_API}/coupons`;
const WISHLIST_API = `${API_V1_PREFIX}/wishlist`;
const WAREHOUSE_API = `${API_V1_PREFIX}/warehouse`;
const RETURNS_API = `${API_V1_PREFIX}/returns`;
const PAYMENTS_API = `${API_V1_PREFIX}/payments`;
const TRACKING_API = `${API_V1_PREFIX}/tracking`;
const VAT_RATES_API = `${API_V1_PREFIX}/vat-rates`;
const CURRENCIES_API = `${API_V1_PREFIX}/currencies`;
const GIFT_CARDS_API = `${API_V1_PREFIX}/gift-cards`;
const LOYALTY_API = `${API_V1_PREFIX}/loyalty`;
const WEBHOOKS_API = `${API_V1_PREFIX}/webhooks`;
const WEBHOOK_INBOXES_API = `${API_V1_PREFIX}/webhook-inboxes`;
const NOTIFICATIONS_API = `${API_V1_PREFIX}/notifications`;
const CLIENT_SESSION_ID_HEADER = 'X-Client-Session-Id';

const PUBLIC_ENDPOINTS = [
  `${USERS_API}/signin`,
  `${USERS_API}/signin/2fa`,
  `${USERS_API}/signup`,
  `${USERS_API}/refresh`,
  `${USERS_API}/password/forgot`,
  `${USERS_API}/password/reset`,
];

interface RefreshableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<TokenPair> | null = null;
const isRefreshEndpoint = (url?: string) => url?.includes(`${USERS_API}/refresh`);
const isPublicEndpoint = (url?: string) => Boolean(url && PUBLIC_ENDPOINTS.includes(url));
const readClientSessionIdHeader = (headers: unknown) => {
  if (!headers || typeof headers !== 'object') {
    return null;
  }

  const headerRecord = headers as Record<string, unknown>;
  const headerValue = headerRecord[CLIENT_SESSION_ID_HEADER] ?? headerRecord[CLIENT_SESSION_ID_HEADER.toLowerCase()];
  return typeof headerValue === 'string' && headerValue.trim() ? headerValue : null;
};

const storeClientSessionId = (clientSessionId: string | null) => {
  if (clientSessionId) {
    authStorage.setClientSessionId(clientSessionId);
  }
};

const enqueueRefresh = (refreshToken: string) => {
  if (!refreshPromise) {
    refreshPromise = auth.refresh({ refreshToken }).then((response) => {
      const tokens = response.data;
      authStorage.setTokens(tokens);
      return tokens;
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const redirectToLogin = () => {
  authStorage.signOut();
  window.location.href = '/login';
};

// Applied to every instance so each one sends the session and bearer headers and retries
// its own requests after a shared token refresh. Only the backend owns the session: a 401 or
// 403 from it signs the user out. warehouse-, payment- and notification-service only accept the
// backend's tokens, so a 403 from them (someone else's order, a missing role) or a 401 that
// survives a successful refresh is their own answer and must not end the session.
const installAuthInterceptors = (instance: AxiosInstance, ownsSession: boolean) => {
  instance.interceptors.request.use((config) => {
    config.headers = config.headers ?? {};
    config.headers[CLIENT_SESSION_ID_HEADER] = authStorage.getClientSessionId();

    if (isPublicEndpoint(config.url)) {
      return config;
    }

    const token = authStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      storeClientSessionId(readClientSessionIdHeader(response.headers));
      return response;
    },
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalRequest = error.config as RefreshableRequestConfig | undefined;
      if (originalRequest && isRefreshEndpoint(originalRequest.url)) {
        redirectToLogin();
        return Promise.reject(error);
      }

      if (originalRequest && isPublicEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      if (status === 401 && originalRequest && !originalRequest._retry) {
        const refreshToken = authStorage.getRefreshToken();
        if (refreshToken) {
          originalRequest._retry = true;
          try {
            const tokens = await enqueueRefresh(refreshToken);
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${tokens.token}`,
            };
            return instance(originalRequest);
          } catch (refreshError) {
            redirectToLogin();
            return Promise.reject(refreshError);
          }
        }
      }

      const sessionRejected = ownsSession
        ? status === 401 || status === 403
        : status === 401 && !originalRequest?._retry;
      if (sessionRejected) {
        redirectToLogin();
      }
      return Promise.reject(error);
    }
  );
};

installAuthInterceptors(api, true);
installAuthInterceptors(warehouseApi, false);
installAuthInterceptors(paymentApi, false);
installAuthInterceptors(notificationApi, false);

const buildStreamingHeaders = (token: string | null) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  [CLIENT_SESSION_ID_HEADER]: authStorage.getClientSessionId(),
});

const postStream = (path: string, payload: unknown, token: string | null) =>
  fetch(getAbsoluteApiUrl(path), {
    method: 'POST',
    headers: buildStreamingHeaders(token),
    body: JSON.stringify(payload),
  });

const streamWithAuth = async (path: string, payload: unknown) => {
  let response = await postStream(path, payload, authStorage.getAccessToken());

  storeClientSessionId(response.headers.get(CLIENT_SESSION_ID_HEADER));

  if (response.status === 401) {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      let tokens: TokenPair;
      try {
        tokens = await enqueueRefresh(refreshToken);
      } catch {
        redirectToLogin();
        throw new Error('Failed to refresh session');
      }

      response = await postStream(path, payload, tokens.token);
      storeClientSessionId(response.headers.get(CLIENT_SESSION_ID_HEADER));
    }
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
    }
    throw new Error(`Failed to fetch stream: ${response.statusText}`);
  }

  return response;
};

export const auth = {
  login: (data: LoginRequest) => 
    api.post<LoginResponse>(`${USERS_API}/signin`, data),

  completeMfaLogin: (data: MfaChallengeRequest) =>
    api.post<LoginResponse>(`${USERS_API}/signin/2fa`, data),
  
  register: (data: RegisterRequest) =>
    api.post<string>(`${USERS_API}/signup`, data),
    
  refresh: (data: RefreshTokenRequest) => 
    api.post<TokenPair>(`${USERS_API}/refresh`, data),
    
  me: () => 
    api.get<User>(`${USERS_API}/me`),

  getUsers: () =>
    api.get<User[]>(USERS_API),

  deleteUser: (username: string) =>
    api.delete(`${USERS_API}/${username}`),

  updateUser: (username: string, data: UserEditDTO) =>
    api.put<User>(`${USERS_API}/${username}`, data),

  logout: (data: LogoutRequest) =>
    api.post<void>(`${USERS_API}/logout`, data),

  requestPasswordReset: (data: ForgotPasswordRequest) =>
    api.post<ForgotPasswordResponse>(`${USERS_API}/password/forgot`, data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<void>(`${USERS_API}/password/reset`, data),

  mfa: {
    status: () => api.get<MfaStatusResponse>(`${USERS_API}/2fa/status`),
    setup: () => api.post<MfaSetupResponse>(`${USERS_API}/2fa/setup`),
    confirm: (data: MfaCodeRequest) =>
      api.post<MfaRecoveryCodesResponse>(`${USERS_API}/2fa/confirm`, data),
    regenerateRecoveryCodes: (data: MfaProtectedActionRequest) =>
      api.post<MfaRecoveryCodesResponse>(`${USERS_API}/2fa/recovery-codes`, data),
    disable: (data: MfaProtectedActionRequest) =>
      api.post<void>(`${USERS_API}/2fa/disable`, data),
  },
};

export const email = {
  send: (data: EmailDto) =>
    api.post<EmailResponse>(EMAIL_API, data),
};

export const qr = {
  create: async (data: CreateQrDto): Promise<QrCodeResponse> => {
    const response = await api.post(`${QR_API}/create`, data, {
      responseType: 'blob',
    });
    return {
      type: 'image/png',
      data: response.data,
    };
  },
};

export const ollama = {
  generate: async (data: GenerateRequestDto) => {
    return streamWithAuth(`${OLLAMA_API}/generate`, data);
  },

  chat: async (data: ChatRequestDto) => {
    return streamWithAuth(`${OLLAMA_API}/chat`, data);
  },

  chatWithTools: async (data: ChatRequestDto) => {
    return streamWithAuth(`${OLLAMA_API}/chat/tools`, data);
  },

  getToolDefinitions: async () => {
    const response = await api.get<OllamaToolDefinition[]>(`${OLLAMA_API}/chat/tools/definitions`);
    return response.data;
  },
};

export const prompts = {
  chat: {
    get: () =>
      api.get<ChatSystemPromptDto>(`${USERS_API}/chat-system-prompt`),

    update: (chatSystemPrompt: string) =>
      api.put<ChatSystemPromptDto>(`${USERS_API}/chat-system-prompt`, { chatSystemPrompt }),
  },
  tool: {
    get: () =>
      api.get<ToolSystemPromptDto>(`${USERS_API}/tool-system-prompt`),

    update: (toolSystemPrompt: string) =>
      api.put<ToolSystemPromptDto>(`${USERS_API}/tool-system-prompt`, { toolSystemPrompt }),
  },
};

const restOrders = {
  getUserOrders: (page: number = 0, size: number = 10, status?: OrderStatus) =>
    api.get<PageDtoOrderDto>(ORDERS_API, {
      params: { page, size, status },
    }),

  getAllOrders: (page: number = 0, size: number = 10, status?: OrderStatus) =>
    api.get<PageDtoOrderDto>(`${ORDERS_API}/admin`, {
      params: { page, size, status },
    }),

  getOrderById: (id: number) => 
    api.get<Order>(`${ORDERS_API}/${id}`),
  
  createOrder: (address: Address, idempotencyKey?: string) =>
    api.post<Order>(ORDERS_API, address, idempotencyKey
      ? { headers: { 'Idempotency-Key': idempotencyKey } }
      : undefined),
  
  updateOrderStatus: (id: number, status: OrderStatus) => 
    api.put<Order>(`${ORDERS_API}/${id}/status`, JSON.stringify(status), {
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  
  cancelOrder: (id: number) => 
    api.post<Order>(`${ORDERS_API}/${id}/cancel`),
};

// Time control for the reservation lab: ends a PENDING order's stock reservation now. REST in
// both commerce transports, like the other admin-only actions.
export const adminOrders = {
  expireReservation: (id: number) => api.post<Order>(`${ADMIN_API}/orders/${id}/expire-reservation`),
};

const restProducts = {
  getAllProducts: () => 
    api.get<Product[]>(PRODUCTS_API),
  
  getProductById: (id: number) => 
    api.get<Product>(`${PRODUCTS_API}/${id}`),
  
  createProduct: (data: ProductCreateDto) => 
    api.post<Product>(PRODUCTS_API, data),
  
  updateProduct: (id: number, data: ProductUpdateDto, etag?: string) =>
    api.put<Product>(`${PRODUCTS_API}/${id}`, data, etag
      ? { headers: { 'If-Match': etag } }
      : undefined),
  
  deleteProduct: (id: number) => 
    api.delete(`${PRODUCTS_API}/${id}`),
};

const restCart = {
  getCart: () => 
    api.get<Cart>(CART_API),
  
  addToCart: (data: CartItemDto) => 
    api.post<Cart>(`${CART_API}/items`, data),
  
  updateCartItem: (productId: number, data: UpdateCartItemDto) => 
    api.put<Cart>(`${CART_API}/items/${productId}`, data),
  
  removeFromCart: (productId: number) => 
    api.delete<Cart>(`${CART_API}/items/${productId}`),
  
  clearCart: () => 
    api.delete(CART_API),
};

export const traffic = {
  getInfo: () => 
    api.get<TrafficInfoDto>(`${TRAFFIC_API}/info`),
};

const restInventory = {
  list: (params: {
    page?: number;
    size?: number;
    search?: string;
    category?: string;
    status?: StockStatus;
    lowStockThreshold?: number;
  } = {}) => api.get<PageDto<InventoryItem>>(INVENTORY_API, { params }),
  get: (productId: number, lowStockThreshold?: number) =>
    api.get<InventoryItem>(`${INVENTORY_API}/${productId}`, {
      params: { lowStockThreshold },
    }),
  adjust: (productId: number, data: InventoryAdjustmentRequest) =>
    api.post<InventoryMovement>(`${INVENTORY_API}/${productId}/adjustments`, data),
  movements: (productId: number, page = 0, size = 20) =>
    api.get<PageDto<InventoryMovement>>(`${INVENTORY_API}/${productId}/movements`, {
      params: { page, size },
    }),
};

const pageParams = (page = 0, size = 20, extra: Record<string, unknown> = {}) => ({ params: { page, size, ...extra } });

export const coupons = {
  list: (page = 0, size = 50) => api.get<Page<Coupon>>(COUPONS_API, pageParams(page, size)),
  create: (data: CouponRequest) => api.post<Coupon>(COUPONS_API, data),
  update: (id: number, data: CouponRequest) => api.put<Coupon>(`${COUPONS_API}/${id}`, data),
  remove: (id: number) => api.delete(`${COUPONS_API}/${id}`),
};

// Coupons always use REST so they work with either commerce transport.
export const cartCoupon = {
  summary: () => api.get<CartWithCoupon>(CART_API),
  apply: (code: string) => api.put<CartWithCoupon>(`${CART_API}/coupon`, { code }),
  remove: () => api.delete<CartWithCoupon>(`${CART_API}/coupon`),
};

export const reviews = {
  list: (productId: number, page = 0, size = 10) =>
    api.get<Page<Review>>(`${PRODUCTS_API}/${productId}/reviews`, pageParams(page, size)),
  summary: (productId: number) => api.get<ReviewSummary>(`${PRODUCTS_API}/${productId}/reviews/summary`),
  mine: (productId: number) => api.get<MyReview>(`${PRODUCTS_API}/${productId}/reviews/mine`),
  create: (productId: number, data: ReviewRequest) => api.post<Review>(`${PRODUCTS_API}/${productId}/reviews`, data),
  update: (productId: number, data: ReviewRequest) => api.put<Review>(`${PRODUCTS_API}/${productId}/reviews/mine`, data),
  remove: (productId: number) => api.delete(`${PRODUCTS_API}/${productId}/reviews/mine`),
};

export const adminReviews = {
  list: (status?: ReviewStatus, page = 0, size = 20) =>
    api.get<Page<Review>>(`${ADMIN_API}/reviews`, pageParams(page, size, { status })),
  moderate: (id: number, data: ModerationRequest) => api.put<Review>(`${ADMIN_API}/reviews/${id}/moderation`, data),
};

export const wishlist = {
  list: () => api.get<WishlistItem[]>(WISHLIST_API),
  upsert: (productId: number, notifyWhenAvailable: boolean) =>
    api.put<WishlistItem>(`${WISHLIST_API}/${productId}`, { notifyWhenAvailable }),
  remove: (productId: number) => api.delete(`${WISHLIST_API}/${productId}`),
};

export const catalogCsv = {
  export: () => api.get<Blob>(`${ADMIN_API}/products/export`, { responseType: 'blob', headers: { Accept: 'text/csv' } }),
  import: (file: File, dryRun: boolean) => {
    const body = new FormData();
    body.append('file', file);
    return api.post<ImportReport>(`${ADMIN_API}/products/import`, body, {
      params: { dryRun },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const warehouse = {
  queue: (page = 0, size = 20) => warehouseApi.get<PageDtoOrderDto>(`${WAREHOUSE_API}/queue`, pageParams(page, size)),
  shipments: (status?: ShipmentStatus, page = 0, size = 50) =>
    warehouseApi.get<Page<Shipment>>(`${WAREHOUSE_API}/shipments`, pageParams(page, size, { status })),
  create: (orderId: number) => warehouseApi.post<Shipment>(`${WAREHOUSE_API}/shipments`, { orderId }),
  pickList: (id: number) => warehouseApi.get<PickList>(`${WAREHOUSE_API}/shipments/${id}/pick-list`),
  pick: (id: number) => warehouseApi.post<Shipment>(`${WAREHOUSE_API}/shipments/${id}/pick`),
  pack: (id: number, weightKg: number) => warehouseApi.post<Shipment>(`${WAREHOUSE_API}/shipments/${id}/pack`, { weightKg }),
  // Without a tracking number warehouse-service generates one and simulates the carrier.
  ship: (id: number, carrier: Carrier, trackingNumber?: string) =>
    warehouseApi.post<Shipment>(`${WAREHOUSE_API}/shipments/${id}/ship`, trackingNumber ? { carrier, trackingNumber } : { carrier }),
  deliver: (id: number) => warehouseApi.post<Shipment>(`${WAREHOUSE_API}/shipments/${id}/deliver`),
  cancel: (id: number) => warehouseApi.post<Shipment>(`${WAREHOUSE_API}/shipments/${id}/cancel`),
  trackOrder: (orderId: number) => warehouseApi.get<Shipment>(`${ORDERS_API}/${orderId}/shipment`),
  // Every parcel of the order, oldest first; empty until the order is released to the warehouse.
  parcels: (orderId: number) => warehouseApi.get<Shipment[]>(`${ORDERS_API}/${orderId}/shipments`),
  // Without a target warehouse-service picks the best other active location.
  reallocate: (id: number, targetLocation?: string) =>
    warehouseApi.post<Shipment>(`${WAREHOUSE_API}/shipments/${id}/reallocate`, targetLocation ? { targetLocation } : {}),
  shortPick: (id: number, data: ShortPickRequest) =>
    warehouseApi.post<Shipment>(`${WAREHOUSE_API}/shipments/${id}/short-pick`, data),
  locations: () => warehouseApi.get<WarehouseLocation[]>(`${WAREHOUSE_API}/locations`),
  setLocationActive: (code: string, active: boolean) =>
    warehouseApi.put<WarehouseLocation>(`${WAREHOUSE_API}/locations/${encodeURIComponent(code)}`, { active }),
  reconciliation: () => warehouseApi.get<ReconciliationEntry[]>(`${WAREHOUSE_API}/reconciliation`),
};

export const returns = {
  create: (orderId: number, data: CreateReturnRequest) => warehouseApi.post<ReturnRequest>(`${ORDERS_API}/${orderId}/returns`, data),
  mine: (page = 0, size = 20) => warehouseApi.get<Page<ReturnRequest>>(RETURNS_API, pageParams(page, size)),
};

export const adminReturns = {
  list: (status?: ReturnStatus, page = 0, size = 50) =>
    warehouseApi.get<Page<ReturnRequest>>(`${ADMIN_API}/returns`, pageParams(page, size, { status })),
  approve: (id: number) => warehouseApi.post<ReturnRequest>(`${ADMIN_API}/returns/${id}/approve`),
  reject: (id: number, note: string) => warehouseApi.post<ReturnRequest>(`${ADMIN_API}/returns/${id}/reject`, { note }),
  receive: (id: number, items: { productId: number; condition: ItemCondition }[]) =>
    warehouseApi.post<ReturnRequest>(`${ADMIN_API}/returns/${id}/receive`, { items }),
  refund: (id: number) => warehouseApi.post<ReturnRequest>(`${ADMIN_API}/returns/${id}/refund`),
};

export const purchasing = {
  suppliers: () => warehouseApi.get<Supplier[]>(`${ADMIN_API}/suppliers`),
  createSupplier: (data: SupplierRequest) => warehouseApi.post<Supplier>(`${ADMIN_API}/suppliers`, data),
  list: (status?: PurchaseOrderStatus, page = 0, size = 50) =>
    warehouseApi.get<Page<PurchaseOrder>>(`${ADMIN_API}/purchase-orders`, pageParams(page, size, { status })),
  create: (data: PurchaseOrderRequest) => warehouseApi.post<PurchaseOrder>(`${ADMIN_API}/purchase-orders`, data),
  submit: (id: number) => warehouseApi.post<PurchaseOrder>(`${ADMIN_API}/purchase-orders/${id}/submit`),
  cancel: (id: number) => warehouseApi.post<PurchaseOrder>(`${ADMIN_API}/purchase-orders/${id}/cancel`),
  receive: (id: number, data: ReceiptRequest) => warehouseApi.post<PurchaseOrder>(`${ADMIN_API}/purchase-orders/${id}/receipts`, data),
  reorderSuggestions: (lowStockThreshold = 5) =>
    warehouseApi.get<ReorderSuggestion[]>(`${INVENTORY_API}/reorder-suggestions`, { params: { lowStockThreshold } }),
};

// Shipment tracking is served by warehouse-service; lookup by tracking number needs no login.
export const tracking = {
  forOrder: (orderId: number) => warehouseApi.get<Tracking>(`${ORDERS_API}/${orderId}/shipment/tracking`),
  byNumber: (trackingNumber: string) =>
    warehouseApi.get<PublicTracking>(`${TRACKING_API}/${encodeURIComponent(trackingNumber)}`),
  advance: (shipmentId: number) => warehouseApi.post<Tracking>(`${WAREHOUSE_API}/shipments/${shipmentId}/carrier/advance`),
};

export const payments = {
  // The key makes a retried submit replay the first result instead of charging twice.
  create: (data: CreatePaymentRequest, idempotencyKey: string) =>
    paymentApi.post<Payment>(PAYMENTS_API, data, { headers: { 'Idempotency-Key': idempotencyKey } }),
  get: (id: string) => paymentApi.get<Payment>(`${PAYMENTS_API}/${id}`),
  confirmThreeDs: (id: string, code: string) => paymentApi.post<Payment>(`${PAYMENTS_API}/${id}/3ds`, { code }),
  forOrder: (orderId: number) => paymentApi.get<Payment[]>(`${ORDERS_API}/${orderId}/payments`),
};

export const adminPayments = {
  list: (status?: PaymentStatus, page = 0, size = 20) =>
    paymentApi.get<PaymentPage>(`${ADMIN_API}/payments`, pageParams(page, size, { status })),
};

export const productSearch = {
  // Repeated `category` values (category=a&category=b), the form Spring binds to a list.
  search: (params: ProductSearchParams = {}) =>
    api.get<ProductSearchResult>(`${PRODUCTS_API}/search`, { params, paramsSerializer: { indexes: null } }),
};

export const vatRates = {
  list: () => api.get<VatRate[]>(VAT_RATES_API),
  get: (countryCode: string) => api.get<VatRate>(`${VAT_RATES_API}/${encodeURIComponent(countryCode)}`),
  upsert: (countryCode: string, data: VatRateRequest) =>
    api.put<VatRate>(`${ADMIN_API}/vat-rates/${encodeURIComponent(countryCode)}`, data),
  // Tax on the current cart for a destination country; without one the backend uses its default.
  preview: (country?: string) => api.get<TaxPreview>(`${CART_API}/tax-preview`, { params: { country } }),
};

export const currencies = {
  list: () => api.get<Currency[]>(CURRENCIES_API),
  convert: (amount: number | string, from: string, to: string) =>
    api.get<CurrencyConversion>(`${CURRENCIES_API}/convert`, { params: { amount, from, to } }),
  upsert: (code: string, data: CurrencyRequest) =>
    api.put<Currency>(`${ADMIN_API}/currencies/${encodeURIComponent(code)}`, data),
};

export const giftCards = {
  balance: (code: string) => api.get<GiftCardBalance>(`${GIFT_CARDS_API}/${encodeURIComponent(code)}`),
};

export const adminGiftCards = {
  list: (status?: GiftCardStatus, page = 0, size = 20) =>
    api.get<Page<GiftCard>>(`${ADMIN_API}/gift-cards`, pageParams(page, size, { status })),
  get: (code: string) => api.get<GiftCard>(`${ADMIN_API}/gift-cards/${encodeURIComponent(code)}`),
  create: (data: GiftCardCreateRequest) => api.post<GiftCard>(`${ADMIN_API}/gift-cards`, data),
  disable: (code: string) => api.post<GiftCard>(`${ADMIN_API}/gift-cards/${encodeURIComponent(code)}/disable`),
};

export const loyalty = {
  account: () => api.get<LoyaltyAccount>(LOYALTY_API),
  transactions: (page = 0, size = 20) =>
    api.get<Page<LoyaltyTransaction>>(`${LOYALTY_API}/transactions`, pageParams(page, size)),
};

// Gift card and loyalty point tenders on the cart; like coupons they always use REST.
export const cartTenders = {
  applyGiftCard: (code: string) => api.put<CartWithCoupon>(`${CART_API}/gift-card`, { code }),
  removeGiftCard: () => api.delete<CartWithCoupon>(`${CART_API}/gift-card`),
  applyPoints: (points: number) => api.put<CartWithCoupon>(`${CART_API}/loyalty-points`, { points }),
  removePoints: () => api.delete<CartWithCoupon>(`${CART_API}/loyalty-points`),
};

// Webhooks are served by notification-service (backend 3.21.0 keeps them only for older stacks).
export const webhooks = {
  list: () => notificationApi.get<WebhookSubscription[]>(WEBHOOKS_API),
  get: (id: number) => notificationApi.get<WebhookSubscription>(`${WEBHOOKS_API}/${id}`),
  create: (data: WebhookCreateRequest) => notificationApi.post<WebhookSubscription>(WEBHOOKS_API, data),
  update: (id: number, data: WebhookUpdateRequest) => notificationApi.put<WebhookSubscription>(`${WEBHOOKS_API}/${id}`, data),
  remove: (id: number) => notificationApi.delete(`${WEBHOOKS_API}/${id}`),
  eventTypes: () => notificationApi.get<WebhookEventType[]>(`${WEBHOOKS_API}/event-types`),
  rotateSecret: (id: number) => notificationApi.post<WebhookSubscription>(`${WEBHOOKS_API}/${id}/rotate-secret`),
  test: (id: number) => notificationApi.post<WebhookDelivery>(`${WEBHOOKS_API}/${id}/test`),
  deliveries: (id: number, status?: WebhookDeliveryStatus, page = 0, size = 20) =>
    notificationApi.get<Page<WebhookDelivery>>(`${WEBHOOKS_API}/${id}/deliveries`, pageParams(page, size, { status })),
  delivery: (id: number, deliveryId: string) =>
    notificationApi.get<WebhookDelivery>(`${WEBHOOKS_API}/${id}/deliveries/${deliveryId}`),
  redeliver: (id: number, deliveryId: string) =>
    notificationApi.post<WebhookDelivery>(`${WEBHOOKS_API}/${id}/deliveries/${deliveryId}/redeliver`),
};

// Disposable receivers for webhook deliveries, so a training user needs no public server.
export const webhookInboxes = {
  list: () => notificationApi.get<WebhookInbox[]>(WEBHOOK_INBOXES_API),
  create: () => notificationApi.post<WebhookInbox>(WEBHOOK_INBOXES_API),
  remove: (token: string) => notificationApi.delete(`${WEBHOOK_INBOXES_API}/${encodeURIComponent(token)}`),
  requests: (token: string) =>
    notificationApi.get<WebhookInboxRequest[]>(`${WEBHOOK_INBOXES_API}/${encodeURIComponent(token)}/requests`),
};

export const adminWebhooks = {
  list: (username?: string, page = 0, size = 20) =>
    notificationApi.get<Page<WebhookSubscription>>(`${ADMIN_API}/webhooks`, pageParams(page, size, { username })),
};

// Commerce emails (payments, shipments, returns, loyalty, gift cards) sent by notification-service.
export const notifications = {
  emails: (page = 0, size = 20) => notificationApi.get<NotificationEmailPage>(`${NOTIFICATIONS_API}/emails`, pageParams(page, size)),
};

const graphqlCommerce = createCommerceGraphql(api);
export const products = commerceTransport === 'graphql' ? graphqlCommerce.products : restProducts;
export const cart = withTrackedWrites(
  commerceTransport === 'graphql' ? graphqlCommerce.cart : restCart,
  ['addToCart', 'updateCartItem', 'removeFromCart', 'clearCart'],
);
export const orders = commerceTransport === 'graphql' ? graphqlCommerce.orders : restOrders;
export const inventory = commerceTransport === 'graphql' ? graphqlCommerce.inventory : restInventory;

export {
  getAbsoluteApiUrl,
  getApiBaseUrl,
  getNotificationApiBaseUrl,
  getPaymentApiBaseUrl,
  getWarehouseApiBaseUrl,
} from './runtimeConfig';
export { notificationApi, paymentApi, warehouseApi };

export default api; 
