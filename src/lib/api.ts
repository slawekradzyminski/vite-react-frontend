import axios from 'axios';
import type { LoginRequest, LoginResponse, RegisterRequest, User, UserEditDTO } from '../types/auth';

const api = axios.create({
  baseURL: 'http://localhost:4001',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
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

export default api; 