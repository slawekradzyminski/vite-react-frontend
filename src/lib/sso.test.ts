import { afterEach, describe, expect, it, vi } from 'vitest';
import { sso } from './sso';
import type { LoginResponse } from '../types/auth';

vi.mock('./api', () => ({
  auth: {
    ssoExchange: vi.fn(),
  },
}));

describe('sso helper', () => {
  afterEach(() => {
    sso.clearCallbackState();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('starts the authorization redirect with PKCE state and nonce', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign, origin: 'https://awesome.byst.re' } as unknown as Location,
    });
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
      .mockReturnValueOnce('22222222-2222-4222-8222-222222222222')
      .mockReturnValueOnce('33333333-3333-4333-8333-333333333333')
      .mockReturnValueOnce('44444444-4444-4444-8444-444444444444');

    await sso.beginLogin(
      {
        VITE_SSO_ENABLED: 'true',
        VITE_SSO_AUTHORITY: 'https://sso.example.com/',
        VITE_SSO_CLIENT_ID: 'awesome-ui',
        VITE_SSO_REDIRECT_URI: '/auth/sso/callback',
        VITE_SSO_POST_LOGOUT_REDIRECT_URI: '/login',
      },
      { origin: 'https://awesome.byst.re' } as Location,
    );

    expect(assign).toHaveBeenCalledWith(expect.stringContaining('https://sso.example.com/protocol/openid-connect/auth'));
    const redirectUrl = new URL(assign.mock.calls[0][0]);
    expect(redirectUrl.searchParams.get('client_id')).toBe('awesome-ui');
    expect(redirectUrl.searchParams.get('redirect_uri')).toBe('https://awesome.byst.re/auth/sso/callback');
    expect(redirectUrl.searchParams.get('response_type')).toBe('code');
    expect(redirectUrl.searchParams.get('code_challenge')).toBeTruthy();
    expect(redirectUrl.searchParams.get('code_challenge_method')).toBe('S256');
    expect(redirectUrl.searchParams.get('state')).toBe('11111111-1111-4111-8111-111111111111');
    expect(redirectUrl.searchParams.get('nonce')).toBe('22222222-2222-4222-8222-222222222222');
    expect(sessionStorage.getItem('ssoState')).toBe('11111111-1111-4111-8111-111111111111');
    expect(sessionStorage.getItem('ssoNonce')).toBe('22222222-2222-4222-8222-222222222222');
    expect(sessionStorage.getItem('ssoCodeVerifier')).toBe(
      '33333333-3333-4333-8333-333333333333-44444444-4444-4444-8444-444444444444',
    );
  });

  it('exchanges the authorization code and backend id token', async () => {
    sessionStorage.setItem('ssoState', 'state-123');
    sessionStorage.setItem('ssoNonce', 'nonce-456');
    sessionStorage.setItem('ssoCodeVerifier', 'verifier-789');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id_token: 'id-456' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const exchange = vi.fn().mockResolvedValue({
      data: {
        token: 'access-123',
        refreshToken: 'refresh-123',
        username: 'alice',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
        roles: [],
      } satisfies LoginResponse,
    });

    await expect(
      sso.completeCallback(
        'https://awesome.byst.re/auth/sso/callback?code=code-123&state=state-123',
        exchange,
        {
          VITE_SSO_ENABLED: 'true',
          VITE_SSO_AUTHORITY: 'https://sso.example.com',
          VITE_SSO_CLIENT_ID: 'awesome-ui',
          VITE_SSO_REDIRECT_URI: 'https://awesome.byst.re/auth/sso/callback',
          VITE_SSO_POST_LOGOUT_REDIRECT_URI: 'https://awesome.byst.re/login',
        },
        { origin: 'https://awesome.byst.re' } as Location,
      ),
    ).resolves.toEqual({
      token: 'access-123',
      refreshToken: 'refresh-123',
      username: 'alice',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      roles: [],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sso.example.com/protocol/openid-connect/token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: expect.any(URLSearchParams),
      }),
    );
    expect(exchange).toHaveBeenCalledWith({ idToken: 'id-456' });
    expect(sessionStorage.getItem('ssoState')).toBeNull();
    expect(sessionStorage.getItem('ssoNonce')).toBeNull();
    expect(sessionStorage.getItem('ssoCodeVerifier')).toBeNull();
  });

  it('reuses the in-flight callback exchange for the same authorization code', async () => {
    sessionStorage.setItem('ssoState', 'state-strict');
    sessionStorage.setItem('ssoNonce', 'nonce-strict');
    sessionStorage.setItem('ssoCodeVerifier', 'verifier-strict');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id_token: 'id-strict' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const exchange = vi.fn().mockResolvedValue({
      data: {
        token: 'access-strict',
        refreshToken: 'refresh-strict',
        username: 'alice',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
        roles: [],
      } satisfies LoginResponse,
    });
    const callbackUrl = 'https://awesome.byst.re/auth/sso/callback?code=code-strict&state=state-strict';
    const env = {
      VITE_SSO_ENABLED: 'true',
      VITE_SSO_AUTHORITY: 'https://sso.example.com',
      VITE_SSO_CLIENT_ID: 'awesome-ui',
      VITE_SSO_REDIRECT_URI: 'https://awesome.byst.re/auth/sso/callback',
      VITE_SSO_POST_LOGOUT_REDIRECT_URI: 'https://awesome.byst.re/login',
    };
    const location = { origin: 'https://awesome.byst.re' } as Location;

    const [first, second] = await Promise.all([
      sso.completeCallback(callbackUrl, exchange, env, location),
      sso.completeCallback(callbackUrl, exchange, env, location),
    ]);

    expect(first.token).toBe('access-strict');
    expect(second.token).toBe('access-strict');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(exchange).toHaveBeenCalledTimes(1);
  });

  it('rejects a mismatched state', async () => {
    sessionStorage.setItem('ssoState', 'state-123');

    await expect(
      sso.completeCallback(
        'https://awesome.byst.re/auth/sso/callback?code=code-123&state=wrong-state',
        vi.fn(),
        {
          VITE_SSO_ENABLED: 'true',
          VITE_SSO_AUTHORITY: 'https://sso.example.com',
          VITE_SSO_CLIENT_ID: 'awesome-ui',
          VITE_SSO_REDIRECT_URI: 'https://awesome.byst.re/auth/sso/callback',
          VITE_SSO_POST_LOGOUT_REDIRECT_URI: 'https://awesome.byst.re/login',
        },
        { origin: 'https://awesome.byst.re' } as Location,
      ),
    ).rejects.toThrow('SSO state mismatch');
  });
});
