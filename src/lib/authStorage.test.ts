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

  it('starts a new client session id when rotated', () => {
    const first = authStorage.getClientSessionId();

    const rotated = authStorage.rotateClientSessionId();

    expect(rotated).not.toBe(first);
    expect(rotated).toMatch(/^[A-Za-z0-9_-]{16,128}$/);
    expect(authStorage.getClientSessionId()).toBe(rotated);
    expect(localStorage.getItem('clientSessionId')).toBe(rotated);
  });

  it('drops the tokens and starts a new client session on sign-out', () => {
    authStorage.setTokens({ token: 'access', refreshToken: 'refresh' });
    const previousSession = authStorage.getClientSessionId();

    authStorage.signOut();

    expect(authStorage.getTokens()).toEqual({ token: null, refreshToken: null });
    expect(authStorage.getClientSessionId()).not.toBe(previousSession);
  });

  it('keeps the client session id when only the tokens are replaced', () => {
    const session = authStorage.getClientSessionId();

    authStorage.setTokens({ token: 'access', refreshToken: 'refresh' });
    authStorage.clearTokens();

    expect(authStorage.getClientSessionId()).toBe(session);
  });

  it('rotates to a backend-valid id without crypto.randomUUID (insecure contexts)', () => {
    const randomUUID = crypto.randomUUID;
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: undefined });
    try {
      const first = authStorage.rotateClientSessionId();
      const second = authStorage.rotateClientSessionId();

      expect(first).toMatch(/^client-session-\d+-[a-z0-9]+$/);
      expect(first).toMatch(/^[A-Za-z0-9_-]{16,128}$/);
      expect(second).not.toBe(first);
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: randomUUID });
    }
  });
});
