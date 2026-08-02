import { afterEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from './authStorage';
import { sso } from './sso';
import type { LoginResponse } from '../types/auth';

vi.mock('./api', () => ({
  auth: {
    ssoExchange: vi.fn(),
  },
}));

const ssoEnv = {
  VITE_SSO_ENABLED: 'true',
  VITE_SSO_AUTHORITY: 'https://sso.example.com',
  VITE_SSO_CLIENT_ID: 'awesome-ui',
  VITE_SSO_REDIRECT_URI: 'https://awesome.byst.re/auth/sso/callback',
  VITE_SSO_POST_LOGOUT_REDIRECT_URI: 'https://awesome.byst.re/login',
};

const runtimeLocation = { origin: 'https://awesome.byst.re' } as Location;

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
    expect(redirectUrl.searchParams.get('scope')).toBe('openid profile email');
    expect(redirectUrl.searchParams.get('prompt')).toBe('login');
    expect(redirectUrl.searchParams.get('code_challenge')).toBeTruthy();
    expect(redirectUrl.searchParams.get('code_challenge'))
      .toBe('NlmvnFLDazaMU3DT-Bh6pNddLOwdBCiVBu__CMLDpcw');
    expect(redirectUrl.searchParams.get('code_challenge_method')).toBe('S256');
    expect(redirectUrl.searchParams.get('state')).toBe('11111111-1111-4111-8111-111111111111');
    expect(redirectUrl.searchParams.get('nonce')).toBe('22222222-2222-4222-8222-222222222222');
    expect(sessionStorage.getItem('ssoState')).toBe('11111111-1111-4111-8111-111111111111');
    expect(sessionStorage.getItem('ssoNonce')).toBe('22222222-2222-4222-8222-222222222222');
    expect(sessionStorage.getItem('ssoCodeVerifier')).toBe(
      '33333333-3333-4333-8333-333333333333-44444444-4444-4444-8444-444444444444',
    );
  });

  it('stores, sanitizes, and consumes the post-SSO return target once', () => {
    sso.rememberLoginReturnTo('/products?view=featured#catalog');

    expect(sso.consumeLoginReturnTo()).toBe('/products?view=featured#catalog');
    expect(sso.consumeLoginReturnTo()).toBe('/');

    sso.rememberLoginReturnTo('https://attacker.example/steal');
    expect(sso.consumeLoginReturnTo()).toBe('/');

    sso.rememberLoginReturnTo('//attacker.example/steal');
    expect(sso.consumeLoginReturnTo()).toBe('/');
  });

  it('starts a social login redirect with kc_idp_hint', async () => {
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

    await sso.beginSocialLogin(
      'google',
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
    expect(redirectUrl.searchParams.get('kc_idp_hint')).toBe('google');
    expect(redirectUrl.searchParams.get('client_id')).toBe('awesome-ui');
    expect(redirectUrl.searchParams.get('redirect_uri')).toBe('https://awesome.byst.re/auth/sso/callback');
    expect(redirectUrl.searchParams.get('response_type')).toBe('code');
    expect(redirectUrl.searchParams.get('scope')).toBe('openid profile email');
    expect(redirectUrl.searchParams.get('prompt')).toBe('login');
    expect(redirectUrl.searchParams.get('code_challenge')).toBeTruthy();
    expect(redirectUrl.searchParams.get('code_challenge'))
      .toBe('NlmvnFLDazaMU3DT-Bh6pNddLOwdBCiVBu__CMLDpcw');
    expect(redirectUrl.searchParams.get('code_challenge_method')).toBe('S256');
    expect(sessionStorage.getItem('ssoState')).toBe('11111111-1111-4111-8111-111111111111');
    expect(sessionStorage.getItem('ssoCodeVerifier')).toBe(
      '33333333-3333-4333-8333-333333333333-44444444-4444-4444-8444-444444444444',
    );
  });

  it('uses the entropy fallback when randomUUID is unavailable', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign, origin: 'https://awesome.byst.re' } as unknown as Location,
    });
    const subtle = crypto.subtle;
    vi.stubGlobal('crypto', { subtle });
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    await sso.beginLogin(ssoEnv, runtimeLocation);

    const verifier = sessionStorage.getItem('ssoCodeVerifier');
    expect(verifier).toBe('1700000000000-i-1700000000000-i');
    const redirectUrl = new URL(assign.mock.calls[0][0]);
    expect(redirectUrl.searchParams.get('state')).toBe('1700000000000-i');
    expect(redirectUrl.searchParams.get('nonce')).toBe('1700000000000-i');
    expect(redirectUrl.searchParams.get('code_challenge')).toBeTruthy();
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
    const tokenRequest = fetchMock.mock.calls[0][1] as RequestInit;
    const tokenBody = tokenRequest.body as URLSearchParams;
    expect(Object.fromEntries(tokenBody.entries())).toEqual({
      grant_type: 'authorization_code',
      client_id: 'awesome-ui',
      code: 'code-123',
      redirect_uri: 'https://awesome.byst.re/auth/sso/callback',
      code_verifier: 'verifier-789',
    });
    expect(exchange).toHaveBeenCalledWith({ idToken: 'id-456' });
    expect(sessionStorage.getItem('ssoState')).toBeNull();
    expect(sessionStorage.getItem('ssoNonce')).toBeNull();
    expect(sessionStorage.getItem('ssoCodeVerifier')).toBeNull();
  });

  it('rejects a callback without an authorization code', async () => {
    await expect(
      sso.completeCallback(
        'https://awesome.byst.re/auth/sso/callback?state=state-123',
        vi.fn(),
        ssoEnv,
        runtimeLocation,
      ),
    ).rejects.toThrow('Missing SSO authorization code');
  });

  it('rejects an identity-provider callback error before token exchange', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sso.completeCallback(
        'https://awesome.byst.re/auth/sso/callback?error=access_denied&error_description=User%20cancelled',
        vi.fn(),
        ssoEnv,
        runtimeLocation,
      ),
    ).rejects.toThrow('access_denied: User cancelled');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a callback when its PKCE verifier is missing', async () => {
    sessionStorage.setItem('ssoState', 'state-123');

    await expect(
      sso.completeCallback(
        'https://awesome.byst.re/auth/sso/callback?code=code-123&state=state-123',
        vi.fn(),
        ssoEnv,
        runtimeLocation,
      ),
    ).rejects.toThrow('Missing SSO code verifier');
  });

  it('rejects a failed authorization-code exchange', async () => {
    sessionStorage.setItem('ssoState', 'state-123');
    sessionStorage.setItem('ssoCodeVerifier', 'verifier-789');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    await expect(
      sso.completeCallback(
        'https://awesome.byst.re/auth/sso/callback?code=code-123&state=state-123',
        vi.fn(),
        ssoEnv,
        runtimeLocation,
      ),
    ).rejects.toThrow('Failed to exchange SSO authorization code');
  });

  it('rejects a token response without an id token', async () => {
    sessionStorage.setItem('ssoState', 'state-123');
    sessionStorage.setItem('ssoCodeVerifier', 'verifier-789');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }));

    await expect(
      sso.completeCallback(
        'https://awesome.byst.re/auth/sso/callback?code=code-123&state=state-123',
        vi.fn(),
        ssoEnv,
        runtimeLocation,
      ),
    ).rejects.toThrow('Missing SSO id token');
  });

  it('retries the same callback after a transient exchange failure', async () => {
    sessionStorage.setItem('ssoState', 'state-retry');
    sessionStorage.setItem('ssoCodeVerifier', 'verifier-retry');
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id_token: 'id-retry' }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const exchange = vi.fn().mockResolvedValue({
      data: {
        token: 'access-retry',
        refreshToken: 'refresh-retry',
        username: 'alice',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
        roles: [],
      } satisfies LoginResponse,
    });
    const callbackUrl = 'https://awesome.byst.re/auth/sso/callback?code=code-retry&state=state-retry';

    await expect(sso.completeCallback(callbackUrl, exchange, ssoEnv, runtimeLocation))
      .rejects.toThrow('temporary network failure');
    await expect(sso.completeCallback(callbackUrl, exchange, ssoEnv, runtimeLocation))
      .resolves.toMatchObject({ token: 'access-retry' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('clears local tokens and builds the configured logout redirect', () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign, origin: 'https://awesome.byst.re' } as unknown as Location,
    });
    authStorage.setTokens({ token: 'access-token', refreshToken: 'refresh-token' });

    sso.beginLogout(ssoEnv, runtimeLocation);

    expect(authStorage.getTokens()).toEqual({ token: null, refreshToken: null });
    const logoutUrl = new URL(assign.mock.calls[0][0]);
    expect(logoutUrl.toString()).toContain('https://sso.example.com/protocol/openid-connect/logout');
    expect(logoutUrl.searchParams.get('client_id')).toBe('awesome-ui');
    expect(logoutUrl.searchParams.get('post_logout_redirect_uri'))
      .toBe('https://awesome.byst.re/login');
  });

  it('reports whether SSO is configured', () => {
    expect(sso.isEnabled(ssoEnv, runtimeLocation)).toBe(true);
    expect(sso.isEnabled({ VITE_SSO_ENABLED: 'false' }, runtimeLocation)).toBe(false);
  });

  it('rejects login and callback operations when SSO is disabled', async () => {
    const disabledEnv = { VITE_SSO_ENABLED: 'false' };

    await expect(sso.beginLogin(disabledEnv, runtimeLocation))
      .rejects.toThrow('SSO is not configured');
    await expect(sso.beginSocialLogin('github', disabledEnv, runtimeLocation))
      .rejects.toThrow('SSO is not configured');
    await expect(sso.completeCallback(
      'https://awesome.byst.re/auth/sso/callback?code=code-123',
      vi.fn(),
      disabledEnv,
      runtimeLocation,
    )).rejects.toThrow('SSO is not configured');
  });

  it('falls back to local login when logging out without SSO configuration', () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign, origin: 'https://awesome.byst.re' } as unknown as Location,
    });
    authStorage.setTokens({ token: 'access-token', refreshToken: 'refresh-token' });

    sso.beginLogout({ VITE_SSO_ENABLED: 'false' }, runtimeLocation);

    expect(authStorage.getTokens()).toEqual({ token: null, refreshToken: null });
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('clears all transient callback state explicitly', () => {
    sessionStorage.setItem('ssoState', 'state');
    sessionStorage.setItem('ssoNonce', 'nonce');
    sessionStorage.setItem('ssoCodeVerifier', 'verifier');
    sessionStorage.setItem('ssoReturnTo', '/products');

    sso.clearCallbackState();

    expect(sessionStorage.getItem('ssoState')).toBeNull();
    expect(sessionStorage.getItem('ssoNonce')).toBeNull();
    expect(sessionStorage.getItem('ssoCodeVerifier')).toBeNull();
    expect(sessionStorage.getItem('ssoReturnTo')).toBeNull();
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
