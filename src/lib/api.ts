import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
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
} from '../types/auth';
import type { EmailDto, EmailResponse } from '../types/email';
import type { CreateQrDto, QrCodeResponse } from '../types/qr';
import type { GenerateRequestDto, ChatRequestDto, OllamaToolDefinition } from '../types/ollama';
import type { ChatSystemPromptDto, ToolSystemPromptDto } from '../types/prompts';
import type { Order, PageDtoOrderDto, Address, OrderStatus } from '../types/order';
import type { Product, ProductCreateDto, ProductUpdateDto } from '../types/product';
import type { Cart, CartItemDto, UpdateCartItemDto } from '../types/cart';
import type { TrafficInfoDto } from '../types/traffic';
import { authStorage } from './authStorage';
import { getAbsoluteApiUrl, getApiBaseUrl } from './runtimeConfig';

const api = axios.create({
  baseURL: getApiBaseUrl(),
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

const PUBLIC_ENDPOINTS = [
  `${USERS_API}/signin`,
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

api.interceptors.request.use((config) => {
  if (config.url && PUBLIC_ENDPOINTS.includes(config.url)) {
    return config;
  }

  const token = authStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RefreshableRequestConfig | undefined;
    if (originalRequest && isRefreshEndpoint(originalRequest.url)) {
      authStorage.clearTokens();
      window.location.href = '/login';
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
          return api(originalRequest);
        } catch (refreshError) {
          authStorage.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    if (status === 401 || status === 403) {
      authStorage.clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const streamWithAuth = async (path: string, payload: unknown) => {
  const response = await fetch(getAbsoluteApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authStorage.getAccessToken() ?? ''}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      authStorage.clearTokens();
      window.location.href = '/login';
    }
    throw new Error(`Failed to fetch stream: ${response.statusText}`);
  }

  return response;
};

export const auth = {
  login: (data: LoginRequest) => 
    api.post<LoginResponse>(`${USERS_API}/signin`, data),
  
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

export const orders = {
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
  
  createOrder: (address: Address) => 
    api.post<Order>(ORDERS_API, address),
  
  updateOrderStatus: (id: number, status: OrderStatus) => 
    api.put<Order>(`${ORDERS_API}/${id}/status`, JSON.stringify(status), {
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  
  cancelOrder: (id: number) => 
    api.post<Order>(`${ORDERS_API}/${id}/cancel`),
};

export const products = {
  getAllProducts: () => 
    api.get<Product[]>(PRODUCTS_API),
  
  getProductById: (id: number) => 
    api.get<Product>(`${PRODUCTS_API}/${id}`),
  
  createProduct: (data: ProductCreateDto) => 
    api.post<Product>(PRODUCTS_API, data),
  
  updateProduct: (id: number, data: ProductUpdateDto) => 
    api.put<Product>(`${PRODUCTS_API}/${id}`, data),
  
  deleteProduct: (id: number) => 
    api.delete(`${PRODUCTS_API}/${id}`),
};

export const cart = {
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

export { getAbsoluteApiUrl, getApiBaseUrl } from './runtimeConfig';

export default api; 
