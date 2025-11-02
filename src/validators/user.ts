import { z } from 'zod';

export const userEditSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  firstName: z.string()
    .min(1, 'First name is required')
    .min(4, 'First name must be at least 4 characters')
    .max(255, 'First name must be at most 255 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .min(4, 'Last name must be at least 4 characters')
    .max(255, 'Last name must be at most 255 characters'),
});

export const systemPromptSchema = z.object({
  systemPrompt: z.string()
    .max(500, 'System prompt must be at most 500 characters')
});

export type UserEditFormData = z.infer<typeof userEditSchema>;
export type SystemPromptFormData = z.infer<typeof systemPromptSchema>; 
