import axios from 'axios';
import type { LoginRequest, LoginResponse, RegisterRequest, User, UserEditDTO } from '../types/auth';
import type { EmailDto, EmailResponse } from '../types/email';
import type { CreateQrDto, QrCodeResponse } from '../types/qr';
import type { GenerateRequestDto } from '../types/ollama';

const api = axios.create({
  baseURL: 'http://localhost:4001',
  headers: {
    'Content-Type': 'application/json',
  },
});

const PUBLIC_ENDPOINTS = ['/users/signin', '/users/signup'];

api.interceptors.request.use((config) => {
  if (config.url && PUBLIC_ENDPOINTS.includes(config.url)) {
    return config;
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data: LoginRequest) => 
    api.post<LoginResponse>('/users/signin', data),
  
  register: (data: RegisterRequest) =>
    api.post<string>('/users/signup', data),
    
  refresh: () => 
    api.get<string>('/users/refresh'),
    
  me: () => 
    api.get<User>('/users/me'),

  getUsers: () =>
    api.get<User[]>('/users'),

  deleteUser: (username: string) =>
    api.delete(`/users/${username}`),

  updateUser: (username: string, data: UserEditDTO) =>
    api.put<User>(`/users/${username}`, data),
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
    const response = await api.post('/api/ollama/generate', data, {
      responseType: 'stream',
    });
    return response.data;
  },
};

export default api; 