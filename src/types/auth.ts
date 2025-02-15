import { RegisterFormData, LoginFormData } from '../validators/auth';

export enum Role {
  ADMIN = 'ROLE_ADMIN',
  CLIENT = 'ROLE_CLIENT',
}

export interface RegisterRequest extends RegisterFormData {
  roles: Role[];
}

export interface LoginRequest extends LoginFormData {}

export interface LoginResponse {
  token: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
}

export interface UserEditDTO {
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: Role[];
} 