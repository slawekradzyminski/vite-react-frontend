import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .min(4, 'Username must be at least 4 characters')
    .max(255, 'Username must be at most 255 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must be at most 255 characters'),
  firstName: z.string()
    .min(1, 'First name is required')
    .min(4, 'First name must be at least 4 characters')
    .max(255, 'First name must be at most 255 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .min(4, 'Last name must be at least 4 characters')
    .max(255, 'Last name must be at most 255 characters'),
});

export const loginSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .min(4, 'Username must be at least 4 characters')
    .max(255, 'Username must be at most 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .min(4, 'Password must be at least 4 characters')
    .max(255, 'Password must be at most 255 characters'),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string()
    .min(1, 'Username or email is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must be at most 255 characters'),
  confirmPassword: z.string()
    .min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords must match',
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>; 
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
