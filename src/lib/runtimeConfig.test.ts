import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAbsoluteApiUrl, getApiBaseUrl, getPasswordResetBaseUrl, getSsoConfig } from './runtimeConfig';

describe('runtimeConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers VITE_API_BASE_URL when configured', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/');

    expect(getApiBaseUrl(import.meta.env, window.location)).toBe('https://api.example.com');
  });

  it('uses localhost backend during local vite development', () => {
    expect(getApiBaseUrl({ DEV: true }, window.location)).toBe('http://localhost:4001');
  });

  it('uses host.docker.internal during dockerized vite development', () => {
    expect(getApiBaseUrl({ DEV: true, VITE_DOCKER: 'true' }, window.location)).toBe('http://host.docker.internal:4001');
  });

  it('uses same-origin backend for production builds', () => {
    expect(
      getApiBaseUrl(
        { DEV: false },
        { origin: 'https://awesome.byst.re' } as Location,
      ),
    ).toBe('https://awesome.byst.re');
  });

  it('defaults password reset links to same-origin reset route', () => {
    expect(
      getPasswordResetBaseUrl(
        { DEV: false },
        { origin: 'https://awesome.byst.re' } as Location,
      ),
    ).toBe('https://awesome.byst.re/reset');
  });

  it('prefers configured password reset base URL when provided', () => {
    vi.stubEnv('VITE_PASSWORD_RESET_BASE_URL', 'https://reset.example.com/reset/');

    expect(getPasswordResetBaseUrl(import.meta.env, window.location)).toBe('https://reset.example.com/reset');
  });

  it('builds absolute websocket URLs from the resolved API origin', () => {
    expect(
      getAbsoluteApiUrl(
        '/api/v1/ws-traffic',
        { DEV: false },
        { origin: 'https://awesome.byst.re' } as Location,
      ),
    ).toBe('https://awesome.byst.re/api/v1/ws-traffic');
  });

  it('returns null when SSO is explicitly disabled', () => {
    expect(
      getSsoConfig(
        { VITE_SSO_ENABLED: 'false' },
        { origin: 'https://awesome.byst.re' } as Location,
      ),
    ).toBeNull();
  });

  it('uses local training SSO defaults on the gateway origin', () => {
    expect(
      getSsoConfig(
        {},
        { origin: 'http://localhost:8081' } as Location,
      ),
    ).toEqual({
      enabled: true,
      authority: 'http://localhost:8082/realms/awesome-testing',
      clientId: 'awesome-testing-frontend',
      redirectUri: 'http://localhost:8081/auth/sso/callback',
      postLogoutRedirectUri: 'http://localhost:8081/login',
    });
  });

  it('normalizes SSO urls against the current origin', () => {
    expect(
      getSsoConfig(
        {
          VITE_SSO_ENABLED: 'true',
          VITE_SSO_AUTHORITY: 'https://sso.example.com/',
          VITE_SSO_CLIENT_ID: 'awesome-ui',
          VITE_SSO_REDIRECT_URI: '/auth/sso/callback',
          VITE_SSO_POST_LOGOUT_REDIRECT_URI: '/login',
        },
        { origin: 'https://awesome.byst.re' } as Location,
      ),
    ).toEqual({
      enabled: true,
      authority: 'https://sso.example.com',
      clientId: 'awesome-ui',
      redirectUri: 'https://awesome.byst.re/auth/sso/callback',
      postLogoutRedirectUri: 'https://awesome.byst.re/login',
    });
  });
});
