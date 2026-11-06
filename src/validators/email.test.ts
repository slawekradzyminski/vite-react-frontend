import { describe, it, expect } from 'vitest';
import { emailSchema } from './email';

describe('emailSchema', () => {
  it('reports each whitespace-only field with its own error', () => {
    const result = emailSchema.safeParse({ to: '   ', subject: '   ', message: '          ' });

    expect(result.success).toBe(false);
    const fieldErrors = result.success ? {} : result.error.flatten().fieldErrors;
    expect(fieldErrors.to).toContain('Recipient is required');
    expect(fieldErrors.subject).toContain('Subject is required');
    expect(fieldErrors.message).toContain('Message is required');
  });
});
