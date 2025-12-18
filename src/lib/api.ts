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

const getApiBaseUrl = () => {
  const isDocker = import.meta.env.VITE_DOCKER === 'true';
  const host = isDocker ? 'host.docker.internal' : 'localhost';
  return `http://${host}:4001`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

const PUBLIC_ENDPOINTS = [
  '/users/signin',
  '/users/signup',
  '/users/refresh',
  '/users/password/forgot',
  '/users/password/reset',
];

interface RefreshableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<TokenPair> | null = null;
const isRefreshEndpoint = (url?: string) => url?.includes('/users/refresh');

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
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
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
    api.post<LoginResponse>('/users/signin', data),
  
  register: (data: RegisterRequest) =>
    api.post<string>('/users/signup', data),
    
  refresh: (data: RefreshTokenRequest) => 
    api.post<TokenPair>('/users/refresh', data),
    
  me: () => 
    api.get<User>('/users/me'),

  getUsers: () =>
    api.get<User[]>('/users'),

  deleteUser: (username: string) =>
    api.delete(`/users/${username}`),

  updateUser: (username: string, data: UserEditDTO) =>
    api.put<User>(`/users/${username}`, data),

  logout: (data: LogoutRequest) =>
    api.post<void>('/users/logout', data),

  requestPasswordReset: (data: ForgotPasswordRequest) =>
    api.post<ForgotPasswordResponse>('/users/password/forgot', data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<void>('/users/password/reset', data),
};

export const email = {
  send: (data: EmailDto) =>
    api.post<EmailResponse>('/email', data),
};

export const qr = {
  create: async (data: CreateQrDto): Promise<QrCodeResponse> => {
    const response = await api.post('/qr/create', data, {
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
    return streamWithAuth('/api/ollama/generate', data);
  },

  chat: async (data: ChatRequestDto) => {
    return streamWithAuth('/api/ollama/chat', data);
  },

  chatWithTools: async (data: ChatRequestDto) => {
    return streamWithAuth('/api/ollama/chat/tools', data);
  },

  getToolDefinitions: async () => {
    const response = await api.get<OllamaToolDefinition[]>('/api/ollama/chat/tools/definitions');
    return response.data;
  },
};

export const prompts = {
  chat: {
    get: () =>
      api.get<ChatSystemPromptDto>('/users/chat-system-prompt'),

    update: (chatSystemPrompt: string) =>
      api.put<ChatSystemPromptDto>('/users/chat-system-prompt', { chatSystemPrompt }),
  },
  tool: {
    get: () =>
      api.get<ToolSystemPromptDto>('/users/tool-system-prompt'),

    update: (toolSystemPrompt: string) =>
      api.put<ToolSystemPromptDto>('/users/tool-system-prompt', { toolSystemPrompt }),
  },
};

export const orders = {
  getUserOrders: (page: number = 0, size: number = 10, status?: OrderStatus) =>
    api.get<PageDtoOrderDto>('/api/orders', {
      params: { page, size, status },
    }),

  getAllOrders: (page: number = 0, size: number = 10, status?: OrderStatus) =>
    api.get<PageDtoOrderDto>('/api/orders/admin', {
      params: { page, size, status },
    }),

  getOrderById: (id: number) => 
    api.get<Order>(`/api/orders/${id}`),
  
  createOrder: (address: Address) => 
    api.post<Order>('/api/orders', address),
  
  updateOrderStatus: (id: number, status: OrderStatus) => 
    api.put<Order>(`/api/orders/${id}/status`, JSON.stringify(status), {
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  
  cancelOrder: (id: number) => 
    api.post<Order>(`/api/orders/${id}/cancel`),
};

export const products = {
  getAllProducts: () => 
    api.get<Product[]>('/api/products'),
  
  getProductById: (id: number) => 
    api.get<Product>(`/api/products/${id}`),
  
  createProduct: (data: ProductCreateDto) => 
    api.post<Product>('/api/products', data),
  
  updateProduct: (id: number, data: ProductUpdateDto) => 
    api.put<Product>(`/api/products/${id}`, data),
  
  deleteProduct: (id: number) => 
    api.delete(`/api/products/${id}`),
};

export const cart = {
  getCart: () => 
    api.get<Cart>('/api/cart'),
  
  addToCart: (data: CartItemDto) => 
    api.post<Cart>('/api/cart/items', data),
  
  updateCartItem: (productId: number, data: UpdateCartItemDto) => 
    api.put<Cart>(`/api/cart/items/${productId}`, data),
  
  removeFromCart: (productId: number) => 
    api.delete<Cart>(`/api/cart/items/${productId}`),
  
  clearCart: () => 
    api.delete('/api/cart'),
};

export const traffic = {
  getInfo: () => 
    api.get<TrafficInfoDto>('/api/traffic/info'),
};

export default api; 
