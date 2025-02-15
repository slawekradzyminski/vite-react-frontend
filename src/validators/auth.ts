import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string({ required_error: 'Username is required' })
    .min(1, 'Username is required')
    .min(4, 'Username must be at least 4 characters')
    .max(255, 'Username must be at most 255 characters'),
  email: z.string({ required_error: 'Email is required' })
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z.string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must be at most 255 characters'),
  firstName: z.string({ required_error: 'First name is required' })
    .min(1, 'First name is required')
    .min(4, 'First name must be at least 4 characters')
    .max(255, 'First name must be at most 255 characters'),
  lastName: z.string({ required_error: 'Last name is required' })
    .min(1, 'Last name is required')
    .min(4, 'Last name must be at least 4 characters')
    .max(255, 'Last name must be at most 255 characters'),
});

export const loginSchema = z.object({
  username: z.string({ required_error: 'Username is required' })
    .min(1, 'Username is required')
    .min(4, 'Username must be at least 4 characters')
    .max(255, 'Username must be at most 255 characters'),
  password: z.string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .min(4, 'Password must be at least 4 characters')
    .max(255, 'Password must be at most 255 characters'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>; 