import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getAbsoluteApiUrl,
  getApiBaseUrl,
  getNotificationApiBaseUrl,
  getPaymentApiBaseUrl,
  getWarehouseApiBaseUrl,
  isPaymentEnabled,
  isWarehouseEnabled,
} from './runtimeConfig';

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

  describe('payment feature flag', () => {
    it('is on unless a build sets VITE_PAYMENT_ENABLED=false', () => {
      expect(isPaymentEnabled({})).toBe(true);
      expect(isPaymentEnabled({ VITE_PAYMENT_ENABLED: '' })).toBe(true);
      expect(isPaymentEnabled({ VITE_PAYMENT_ENABLED: 'true' })).toBe(true);
    });

    it('accepts false in any case and with surrounding whitespace', () => {
      expect(isPaymentEnabled({ VITE_PAYMENT_ENABLED: 'false' })).toBe(false);
      expect(isPaymentEnabled({ VITE_PAYMENT_ENABLED: '  FALSE  ' })).toBe(false);
    });

    it('is independent of the warehouse flag', () => {
      expect(isPaymentEnabled({ VITE_WAREHOUSE_ENABLED: 'false' })).toBe(true);
      expect(isWarehouseEnabled({ VITE_PAYMENT_ENABLED: 'false' })).toBe(true);
    });

    it('reads the Vite environment by default', () => {
      expect(isPaymentEnabled()).toBe(true);
      vi.stubEnv('VITE_PAYMENT_ENABLED', 'false');

      expect(isPaymentEnabled()).toBe(false);
    });
  });

  describe('payment API base URL', () => {
    const production = { origin: 'https://awesome.byst.re' } as Location;

    it('prefers VITE_PAYMENT_API_BASE_URL, trimmed and without trailing slashes', () => {
      expect(
        getPaymentApiBaseUrl(
          {
            VITE_API_BASE_URL: 'https://api.example.com',
            VITE_WAREHOUSE_API_BASE_URL: 'http://localhost:4003',
            VITE_PAYMENT_API_BASE_URL: '  http://localhost:4004//  ',
          },
          production,
        ),
      ).toBe('http://localhost:4004');
    });

    it('reads VITE_PAYMENT_API_BASE_URL from the Vite environment by default', () => {
      vi.stubEnv('VITE_PAYMENT_API_BASE_URL', 'https://payment.example.com/');

      expect(getPaymentApiBaseUrl()).toBe('https://payment.example.com');
    });

    it('falls back to the configured API base URL, not the warehouse one', () => {
      expect(
        getPaymentApiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.com/', VITE_WAREHOUSE_API_BASE_URL: 'http://localhost:4003' }, production),
      ).toBe('https://api.example.com');
    });

    it('treats a blank payment URL as unset', () => {
      expect(
        getPaymentApiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.com', VITE_PAYMENT_API_BASE_URL: '   ' }, production),
      ).toBe('https://api.example.com');
    });

    it('follows the backend during local vite development and same-origin builds', () => {
      expect(getPaymentApiBaseUrl({ DEV: true }, production)).toBe('http://localhost:4001');
      expect(getPaymentApiBaseUrl({ DEV: false }, production)).toBe('https://awesome.byst.re');
    });
  });
  describe('notification API base URL', () => {
    const production = { origin: 'https://awesome.byst.re' } as Location;

    it('prefers VITE_NOTIFICATION_API_BASE_URL, trimmed and without trailing slashes', () => {
      expect(
        getNotificationApiBaseUrl(
          {
            VITE_API_BASE_URL: 'https://api.example.com',
            VITE_PAYMENT_API_BASE_URL: 'http://localhost:4004',
            VITE_NOTIFICATION_API_BASE_URL: '  http://localhost:4005//  ',
          },
          production,
        ),
      ).toBe('http://localhost:4005');
    });

    it('reads VITE_NOTIFICATION_API_BASE_URL from the Vite environment by default', () => {
      vi.stubEnv('VITE_NOTIFICATION_API_BASE_URL', 'https://notification.example.com/');

      expect(getNotificationApiBaseUrl()).toBe('https://notification.example.com');
    });

    it('falls back to the configured API base URL, not the warehouse or payment one', () => {
      expect(
        getNotificationApiBaseUrl(
          { VITE_API_BASE_URL: 'https://api.example.com/', VITE_WAREHOUSE_API_BASE_URL: 'http://localhost:4003', VITE_PAYMENT_API_BASE_URL: 'http://localhost:4004' },
          production,
        ),
      ).toBe('https://api.example.com');
    });

    it('treats a blank notification URL as unset', () => {
      expect(
        getNotificationApiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.com', VITE_NOTIFICATION_API_BASE_URL: '   ' }, production),
      ).toBe('https://api.example.com');
    });

    it('follows the backend during local vite development and same-origin builds', () => {
      expect(getNotificationApiBaseUrl({ DEV: true }, production)).toBe('http://localhost:4001');
      expect(getNotificationApiBaseUrl({ DEV: false }, production)).toBe('https://awesome.byst.re');
    });
  });
});
