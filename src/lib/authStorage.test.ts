import { beforeEach, describe, expect, it } from 'vitest';
import { authStorage } from './authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the same generated client session id across calls', () => {
    const first = authStorage.getClientSessionId();

    expect(first).toEqual(expect.any(String));
    expect(first).not.toBe('');
    expect(authStorage.getClientSessionId()).toBe(first);
    expect(localStorage.getItem('clientSessionId')).toBe(first);
  });

  it('stores and clears both tokens together', () => {
    authStorage.setTokens({ token: 'access', refreshToken: 'refresh' });

    expect(authStorage.getTokens()).toEqual({ token: 'access', refreshToken: 'refresh' });

    authStorage.clearTokens();

    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
  });
});
