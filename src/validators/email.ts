import { z } from 'zod';
import type { EmailFormData } from '../types/email';

export const emailSchema = z.object({
  to: z.string()
    .min(1, 'Recipient is required')
    .email('Invalid email address'),
  subject: z.string()
    .min(1, 'Subject is required')
    .min(3, 'Subject must be at least 3 characters')
    .max(100, 'Subject must be at most 100 characters'),
  message: z.string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be at most 1000 characters'),
});

export type { EmailFormData }; 
