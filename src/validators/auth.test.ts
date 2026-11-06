import { describe, it, expect } from 'vitest';
import { loginSchema } from './auth';

describe('loginSchema', () => {
  it('ignores spaces around a pasted username', () => {
    expect(loginSchema.parse({ username: '  admin  ', password: 'admin123' }).username).toBe('admin');
  });

  it('keeps the password exactly as typed', () => {
    expect(loginSchema.parse({ username: 'admin', password: ' secret ' }).password).toBe(' secret ');
  });

  it('rejects a whitespace-only username', () => {
    expect(loginSchema.safeParse({ username: '     ', password: 'admin123' }).success).toBe(false);
  });
});
