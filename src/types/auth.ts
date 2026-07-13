import { RegisterFormData, LoginFormData, ForgotPasswordFormData, ResetPasswordFormData } from '../validators/auth';

export enum Role {
  ADMIN = 'ROLE_ADMIN',
  CLIENT = 'ROLE_CLIENT',
}

export interface RegisterRequest extends RegisterFormData {
  roles: Role[];
}

export interface LoginRequest extends LoginFormData {}

export interface LoginResponse {
  token?: string | null;
  refreshToken?: string | null;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  mfaRequired?: boolean;
  challengeToken?: string | null;
  challengeExpiresAt?: string | null;
}

export interface MfaChallengeRequest {
  challengeToken: string;
  code: string;
}

export interface MfaStatusResponse {
  enabled: boolean;
  unusedRecoveryCodes: number;
}

export interface MfaSetupResponse {
  secret: string;
  otpAuthUri: string;
  qrCodeDataUri: string;
  expiresAt: string;
}

export interface MfaCodeRequest {
  code: string;
}

export interface MfaProtectedActionRequest extends MfaCodeRequest {
  password: string;
}

export interface MfaRecoveryCodesResponse {
  recoveryCodes: string[];
}

export interface SsoExchangeRequest {
  idToken: string;
}

export interface TokenPair {
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
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

export interface ForgotPasswordRequest extends ForgotPasswordFormData {
  resetBaseUrl?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  token?: string;
}

export interface ResetPasswordRequest extends ResetPasswordFormData {}
