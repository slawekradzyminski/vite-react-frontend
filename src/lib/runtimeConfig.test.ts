import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAbsoluteApiUrl, getApiBaseUrl, getSsoConfig, getWarehouseApiBaseUrl, isWarehouseEnabled } from './runtimeConfig';

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

  it('uses local training SSO defaults on the loopback gateway origin', () => {
    expect(
      getSsoConfig(
        {},
        { origin: 'http://127.0.0.1:8081' } as Location,
      ),
    ).toEqual({
      enabled: true,
      authority: 'http://localhost:8082/realms/awesome-testing',
      clientId: 'awesome-testing-frontend',
      redirectUri: 'http://127.0.0.1:8081/auth/sso/callback',
      postLogoutRedirectUri: 'http://127.0.0.1:8081/login',
    });
  });

  it('does not implicitly enable training SSO on unrelated origins', () => {
    expect(
      getSsoConfig(
        {},
        { origin: 'https://awesome.byst.re' } as Location,
      ),
    ).toBeNull();
  });

  it('does not implicitly enable training SSO on unrelated loopback ports', () => {
    expect(
      getSsoConfig(
        {},
        { origin: 'http://localhost:5173' } as Location,
      ),
    ).toBeNull();
    expect(
      getSsoConfig(
        {},
        { origin: 'http://127.0.0.1:4001' } as Location,
      ),
    ).toBeNull();
  });

  it('trims configured API values and repeated trailing slashes', () => {
    expect(
      getApiBaseUrl(
        { VITE_API_BASE_URL: '  https://api.example.com///  ' },
        window.location,
      ),
    ).toBe('https://api.example.com');
  });

  describe('warehouse feature flag', () => {
    it('is on unless a build sets VITE_WAREHOUSE_ENABLED=false', () => {
      expect(isWarehouseEnabled({})).toBe(true);
      expect(isWarehouseEnabled({ VITE_WAREHOUSE_ENABLED: '' })).toBe(true);
      expect(isWarehouseEnabled({ VITE_WAREHOUSE_ENABLED: 'true' })).toBe(true);
    });

    it('accepts false in any case and with surrounding whitespace', () => {
      expect(isWarehouseEnabled({ VITE_WAREHOUSE_ENABLED: 'false' })).toBe(false);
      expect(isWarehouseEnabled({ VITE_WAREHOUSE_ENABLED: '  FALSE  ' })).toBe(false);
    });

    it('reads the Vite environment by default', () => {
      expect(isWarehouseEnabled()).toBe(true);
      vi.stubEnv('VITE_WAREHOUSE_ENABLED', 'false');

      expect(isWarehouseEnabled()).toBe(false);
    });
  });

  describe('warehouse API base URL', () => {
    const production = { origin: 'https://awesome.byst.re' } as Location;

    it('prefers VITE_WAREHOUSE_API_BASE_URL, trimmed and without trailing slashes', () => {
      expect(
        getWarehouseApiBaseUrl(
          { VITE_API_BASE_URL: 'https://api.example.com', VITE_WAREHOUSE_API_BASE_URL: '  http://localhost:4003//  ' },
          production,
        ),
      ).toBe('http://localhost:4003');
    });

    it('reads VITE_WAREHOUSE_API_BASE_URL from the Vite environment by default', () => {
      vi.stubEnv('VITE_WAREHOUSE_API_BASE_URL', 'https://warehouse.example.com/');

      expect(getWarehouseApiBaseUrl()).toBe('https://warehouse.example.com');
    });

    it('falls back to the configured API base URL', () => {
      expect(getWarehouseApiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.com/' }, production)).toBe('https://api.example.com');
    });

    it('treats a blank warehouse URL as unset', () => {
      expect(
        getWarehouseApiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.com', VITE_WAREHOUSE_API_BASE_URL: '   ' }, production),
      ).toBe('https://api.example.com');
    });

    it('follows the backend during local vite development and same-origin builds', () => {
      expect(getWarehouseApiBaseUrl({ DEV: true }, production)).toBe('http://localhost:4001');
      expect(getWarehouseApiBaseUrl({ DEV: false }, production)).toBe('https://awesome.byst.re');
    });
  });

  it('normalizes SSO urls against the current origin', () => {
    expect(
      getSsoConfig(
        {
          VITE_SSO_ENABLED: 'true',
          VITE_SSO_AUTHORITY: '  https://sso.example.com///  ',
          VITE_SSO_CLIENT_ID: '  awesome-ui  ',
          VITE_SSO_REDIRECT_URI: '  /auth/sso/callback  ',
          VITE_SSO_POST_LOGOUT_REDIRECT_URI: '  /login  ',
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
