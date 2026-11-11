import { z } from 'zod';

// Mirrors WebhookCreateDto/WebhookUpdateDto. The backend still runs its SSRF policy on the
// URL; this only catches what is wrong before a round trip.
export const webhookSchema = z.object({
  url: z.string()
    .trim()
    .min(1, 'URL is required')
    .max(2048, 'URL must be at most 2048 characters')
    .refine((value) => /^(https?:\/\/\S+|inbox:\/\/\S+)$/i.test(value), 'Use an http(s):// URL or an inbox:// URL'),
  events: z.array(z.string()).min(1, 'Select at least one event').max(20, 'Select at most 20 events'),
  description: z.string().trim().max(255, 'Description must be at most 255 characters'),
  active: z.boolean(),
});

export type WebhookFormData = z.infer<typeof webhookSchema>;

export const EMPTY_WEBHOOK_FORM: WebhookFormData = { url: '', events: [], description: '', active: true };

type WebhookField = 'url' | 'events' | 'description';

// Places a backend 400 next to the field it is about: a field-to-message map names the
// field, and the URL policy and event-type messages are recognised by their wording.
export function webhookServerErrors(data: unknown): { field?: WebhookField; message: string }[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim()) {
    const message = record.message;
    if (/url/i.test(message)) return [{ field: 'url', message }];
    if (/event type/i.test(message)) return [{ field: 'events', message }];
    return [{ message }];
  }
  return (['url', 'events', 'description'] as const)
    .filter((field) => typeof record[field] === 'string')
    .map((field) => ({ field, message: record[field] as string }));
}
