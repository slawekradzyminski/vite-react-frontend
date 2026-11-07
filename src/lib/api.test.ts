import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth, inventory, ollama, qr } from './api';
import { Role } from '../types/auth';

const mockAxios = vi.hoisted(() => {
  const instance: any = vi.fn(() => Promise.resolve({ data: {} }));
  instance.interceptors = {
    request: { use: vi.fn((onSuccess) => { instance.requestInterceptor = onSuccess; }) },
    response: { use: vi.fn((onSuccess, onError) => {
      instance.responseSuccessInterceptor = onSuccess;
      instance.responseErrorInterceptor = onError;
    }) },
  };
  instance.post = vi.fn();
  instance.get = vi.fn();
  instance.put = vi.fn();
  instance.delete = vi.fn();
  instance.defaults = { baseURL: 'http://localhost:4001' };
  instance.create = vi.fn(() => instance);
  return instance;
});

describe('inventory API', () => {
  beforeEach(() => {
    mockAxios.get.mockReset();
    mockAxios.post.mockReset();
  });

  it('lists inventory with the backend paging and filter parameters', async () => {
    const params = {
      page: 2,
      size: 20,
      search: 'cable',
      category: 'Accessories',
      status: 'LOW_STOCK' as const,
      lowStockThreshold: 4,
    };

    await inventory.list(params);

    expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/admin/inventory', { params });
  });

  it('gets inventory detail with the selected low-stock threshold', async () => {
    await inventory.get(42, 7);

    expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/admin/inventory/42', {
      params: { lowStockThreshold: 7 },
    });
  });

  it('posts a signed stock adjustment with its idempotency request id', async () => {
    const adjustment = {
      delta: -3,
      reason: 'Damaged during handling',
      requestId: '3e4b5ce0-822b-4d09-9f5a-bc6bc87a65cc',
    };

    await inventory.adjust(42, adjustment);

    expect(mockAxios.post).toHaveBeenCalledWith(
      '/api/v1/admin/inventory/42/adjustments',
      adjustment
    );
  });

  it('gets paged movement history with explicit defaults', async () => {
    await inventory.movements(42);

    expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/admin/inventory/42/movements', {
      params: { page: 0, size: 20 },
    });
  });
});

vi.mock('axios', () => ({
  default: mockAxios,
}));

const originalFetch = global.fetch;
const localStorageStore = new Map<string, string>();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: vi.fn((key: string) => localStorageStore.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageStore.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      localStorageStore.delete(key);
    }),
    clear: vi.fn(() => {
      localStorageStore.clear();
    }),
  },
});

describe('auth API', () => {
  afterEach(() => {
    mockAxios.mockClear();
    mockAxios.post.mockReset();
    mockAxios.get.mockReset();
    mockAxios.put.mockReset();
    mockAxios.delete.mockReset();
    localStorage.clear();
  });

  describe('login', () => {
    it('calls the correct endpoint with credentials', async () => {
      await auth.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/users/signin', {
        username: 'testuser',
        password: 'password123',
      });
    });

    it('completes an MFA login challenge on the public endpoint', async () => {
      await auth.completeMfaLogin({ challengeToken: 'challenge-123', code: '123456' });

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/users/signin/2fa', {
        challengeToken: 'challenge-123',
        code: '123456',
      });
    });
  });

  describe('MFA management', () => {
    it('calls status, setup, confirmation, recovery replacement, and disable endpoints', async () => {
      await auth.mfa.status();
      await auth.mfa.setup();
      await auth.mfa.confirm({ code: '123456' });
      await auth.mfa.regenerateRecoveryCodes({ password: 'password', code: '234567' });
      await auth.mfa.disable({ password: 'password', code: 'AAAA-BBBB-CCCC-DDDD-EEEE' });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/users/2fa/status');
      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/users/2fa/setup');
      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/users/2fa/confirm', { code: '123456' });
      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/users/2fa/recovery-codes', { password: 'password', code: '234567' });
      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/users/2fa/disable', { password: 'password', code: 'AAAA-BBBB-CCCC-DDDD-EEEE' });
    });
  });

  describe('register', () => {
    it('calls the correct endpoint with user data', async () => {
      const registerData = {
        username: 'newuser',
        password: 'password123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [Role.CLIENT],
      };

      await auth.register(registerData);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/users/signup', registerData);
    });
  });

  describe('getUsers', () => {
    it('calls the correct endpoint', async () => {
      await auth.getUsers();

      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/users');
    });
  });

  describe('deleteUser', () => {
    it('calls the correct endpoint with username', async () => {
      const username = 'testuser';

      await auth.deleteUser(username);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/api/v1/users/${username}`);
    });
  });

  describe('logout', () => {
    it('calls logout endpoint with refresh payload', async () => {
      await auth.logout({ refreshToken: 'refresh-123' });

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/users/logout', { refreshToken: 'refresh-123' });
    });
  });

  describe('ssoExchange', () => {
    it('calls the SSO exchange endpoint with the id token', async () => {
      await auth.ssoExchange({ idToken: 'id-token-123' });

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/users/sso/exchange', { idToken: 'id-token-123' });
    });
  });
});

describe('API Client', () => {
  beforeEach(() => {
    mockAxios.mockClear();
    mockAxios.post.mockReset();
    mockAxios.get.mockReset();
    mockAxios.put.mockReset();
    mockAxios.delete.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('QR API', () => {
    it('should generate QR code', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      mockAxios.post.mockResolvedValue({ data: mockBlob });

      const response = await qr.create({ text: 'test' });

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/qr/create', { text: 'test' }, { responseType: 'blob' });
      expect(response.type).toBe('image/png');
      expect(response.data).toBeInstanceOf(Blob);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockAxios.post.mockRejectedValue(error);

      await expect(qr.create({ text: '' })).rejects.toThrow('API Error');
    });
  });

  describe('axios interceptors', () => {
    const getRequestInterceptor = () => {
      if (!mockAxios.requestInterceptor) {
        throw new Error('Request interceptor was not registered');
      }
      return mockAxios.requestInterceptor;
    };

    const getErrorInterceptor = () => {
      if (!mockAxios.responseErrorInterceptor) {
        throw new Error('Response interceptor was not registered');
      }
      return mockAxios.responseErrorInterceptor;
    };

    it('attaches bearer token for protected requests', () => {
      const requestInterceptor = getRequestInterceptor();
      localStorage.setItem('token', 'test-token');

      const config = requestInterceptor({
        url: '/api/v1/orders',
        headers: {},
      });

      expect(config.headers.Authorization).toBe('Bearer test-token');
      expect(config.headers['X-Client-Session-Id']).toEqual(expect.any(String));
    });

    it('skips auth header for public endpoints', () => {
      const requestInterceptor = getRequestInterceptor();
      localStorage.setItem('token', 'test-token');

      const config = requestInterceptor({
        url: '/api/v1/users/signin',
        headers: {},
      });

      expect(config.headers.Authorization).toBeUndefined();
      expect(config.headers['X-Client-Session-Id']).toEqual(expect.any(String));
    });

    it('treats MFA challenge completion as a public endpoint', () => {
      const requestInterceptor = getRequestInterceptor();
      localStorage.setItem('token', 'stale-token');

      const config = requestInterceptor({
        url: '/api/v1/users/signin/2fa',
        headers: {},
      });

      expect(config.headers.Authorization).toBeUndefined();
    });

    it('reuses an existing client session id', () => {
      const requestInterceptor = getRequestInterceptor();
      localStorage.setItem('clientSessionId', 'client-session-123');

      const config = requestInterceptor({
        url: '/api/v1/orders',
        headers: {},
      });

      expect(config.headers['X-Client-Session-Id']).toBe('client-session-123');
    });

    it('stores client session id returned by the server', async () => {
      const successInterceptor = mockAxios.responseSuccessInterceptor;
      if (!successInterceptor) {
        throw new Error('Success interceptor was not registered');
      }

      const response = successInterceptor({
        headers: {
          'x-client-session-id': 'server-session-456',
        },
      });

      expect(localStorage.getItem('clientSessionId')).toBe('server-session-456');
      expect(response).toEqual({
        headers: {
          'x-client-session-id': 'server-session-456',
        },
      });
    });

    it('refreshes token and retries the original request on 401', async () => {
      const errorInterceptor = getErrorInterceptor();
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('refreshToken', 'refresh-123');
      const refreshSpy = vi.spyOn(auth, 'refresh').mockResolvedValue({
        data: {
          token: 'new-token',
          refreshToken: 'new-refresh',
        },
      } as any);
      mockAxios.mockResolvedValueOnce({ data: { ok: true } });

      const response = await errorInterceptor({
        config: { url: '/api/v1/orders', headers: {}, _retry: false },
        response: { status: 401 },
      } as any);

      expect(refreshSpy).toHaveBeenCalledWith({ refreshToken: 'refresh-123' });
      expect(localStorage.getItem('token')).toBe('new-token');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
      expect(mockAxios).toHaveBeenCalledWith(expect.objectContaining({
        url: '/api/v1/orders',
        headers: expect.objectContaining({ Authorization: 'Bearer new-token' }),
      }));
      expect(response).toEqual({ data: { ok: true } });
      refreshSpy.mockRestore();
    });

    it('clears tokens and redirects when refresh fails', async () => {
      const errorInterceptor = getErrorInterceptor();
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('refreshToken', 'refresh-123');
      const refreshSpy = vi.spyOn(auth, 'refresh').mockRejectedValue(new Error('Invalid refresh token'));
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      await expect(
        errorInterceptor({
          config: { url: '/api/v1/orders', headers: {}, _retry: false },
          response: { status: 401 },
        } as any)
      ).rejects.toThrow('Invalid refresh token');

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(window.location.href).toBe('/login');
      refreshSpy.mockRestore();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('redirects immediately when no refresh token is available', async () => {
      const errorInterceptor = getErrorInterceptor();
      localStorage.setItem('token', 'expired-token');
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      const error = { response: { status: 401 }, message: 'Unauthorized' };
      await expect(errorInterceptor(error)).rejects.toBe(error);

      expect(localStorage.getItem('token')).toBeNull();
      expect(window.location.href).toBe('/login');

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('clears tokens when the refresh endpoint returns 401', async () => {
      const errorInterceptor = getErrorInterceptor();
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('refreshToken', 'refresh-123');
      const refreshSpy = vi.spyOn(auth, 'refresh');
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      const error = {
        config: { url: '/api/v1/users/refresh', headers: {}, _retry: false },
        response: { status: 401 },
      };

      await expect(errorInterceptor(error as any)).rejects.toBe(error as any);
      expect(refreshSpy).not.toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(window.location.href).toBe('/login');

      refreshSpy.mockRestore();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('passes through non-auth errors without redirect', async () => {
      const errorInterceptor = getErrorInterceptor();
      localStorage.setItem('token', 'test-token');

      const error = { response: { status: 500 }, message: 'Server Error' };
      await expect(errorInterceptor(error)).rejects.toBe(error);

      expect(localStorage.getItem('token')).toBe('test-token');
    });

    it('does not redirect on public endpoint 401 responses', async () => {
      const errorInterceptor = getErrorInterceptor();
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      const error = {
        config: { url: '/api/v1/users/sso/exchange', headers: {}, _retry: false },
        response: { status: 401 },
      };

      await expect(errorInterceptor(error as any)).rejects.toBe(error as any);
      expect(localStorage.getItem('token')).toBeNull();
      expect(window.location.href).toBe('http://localhost/');

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('does not attach an Authorization header when there is no access token', () => {
      const config = getRequestInterceptor()({
        url: '/api/v1/orders',
        headers: {},
      });

      expect(config.headers.Authorization).toBeUndefined();
    });

    it('keeps the client session id when a response carries none', () => {
      const successInterceptor = mockAxios.responseSuccessInterceptor;
      if (!successInterceptor) {
        throw new Error('Success interceptor was not registered');
      }
      localStorage.setItem('clientSessionId', 'existing-session');

      successInterceptor({ headers: { 'x-client-session-id': '   ' } });
      successInterceptor({ headers: undefined });

      expect(localStorage.getItem('clientSessionId')).toBe('existing-session');
    });

    it('shares one token refresh between parallel 401 responses', async () => {
      const errorInterceptor = getErrorInterceptor();
      localStorage.setItem('refreshToken', 'refresh-123');
      let resolveRefresh: (value: unknown) => void = () => {};
      const refreshSpy = vi.spyOn(auth, 'refresh').mockReturnValue(
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }) as any
      );
      mockAxios.mockResolvedValue({ data: { ok: true } });

      const first = errorInterceptor({
        config: { url: '/api/v1/orders', headers: {} },
        response: { status: 401 },
      } as any);
      const second = errorInterceptor({
        config: { url: '/api/v1/cart', headers: {} },
        response: { status: 401 },
      } as any);
      resolveRefresh({ data: { token: 'new-token', refreshToken: 'new-refresh' } });
      await Promise.all([first, second]);

      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(mockAxios).toHaveBeenCalledTimes(2);
      expect(mockAxios).toHaveBeenCalledWith(expect.objectContaining({
        url: '/api/v1/cart',
        _retry: true,
        headers: expect.objectContaining({ Authorization: 'Bearer new-token' }),
      }));
      refreshSpy.mockRestore();
      mockAxios.mockReset();
    });

    it('redirects instead of refreshing again when a retried request is still unauthorized', async () => {
      const errorInterceptor = getErrorInterceptor();
      localStorage.setItem('token', 'new-token');
      localStorage.setItem('refreshToken', 'refresh-123');
      const refreshSpy = vi.spyOn(auth, 'refresh');
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      const error = {
        config: { url: '/api/v1/orders', headers: {}, _retry: true },
        response: { status: 401 },
      };
      await expect(errorInterceptor(error as any)).rejects.toBe(error as any);

      expect(refreshSpy).not.toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBeNull();
      expect(window.location.href).toBe('/login');
      refreshSpy.mockRestore();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('does not attempt a refresh for a 401 when no refresh token is stored', async () => {
      const errorInterceptor = getErrorInterceptor();
      localStorage.setItem('token', 'expired-token');
      const refreshSpy = vi.spyOn(auth, 'refresh');
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      const error = {
        config: { url: '/api/v1/orders', headers: {} },
        response: { status: 401 },
      };
      await expect(errorInterceptor(error as any)).rejects.toBe(error as any);

      expect(refreshSpy).not.toHaveBeenCalled();
      expect(window.location.href).toBe('/login');
      refreshSpy.mockRestore();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('redirects on 403 without trying to refresh the token', async () => {
      const errorInterceptor = getErrorInterceptor();
      localStorage.setItem('token', 'valid-token');
      localStorage.setItem('refreshToken', 'refresh-123');
      const refreshSpy = vi.spyOn(auth, 'refresh');
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      const error = {
        config: { url: '/api/v1/orders/admin', headers: {} },
        response: { status: 403 },
      };
      await expect(errorInterceptor(error as any)).rejects.toBe(error as any);

      expect(refreshSpy).not.toHaveBeenCalled();
      expect(window.location.href).toBe('/login');
      refreshSpy.mockRestore();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });
  });

  describe('ollama API', () => {
    const requestBody = {
      model: 'mistral',
      prompt: 'hello',
      think: false,
      options: { temperature: 0.5 },
    };
    const apiBase =
      import.meta.env.VITE_DOCKER === 'true'
        ? 'http://host.docker.internal:4001'
        : 'http://localhost:4001';

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('sends generate requests with auth header', async () => {
      const mockResponse = new Response('stream');
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);
      localStorage.setItem('token', 'abc');
      localStorage.setItem('clientSessionId', 'client-session-789');

      const response = await ollama.generate(requestBody);

      expect(global.fetch).toHaveBeenCalledWith(
        `${apiBase}/api/v1/ollama/generate`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer abc',
            'X-Client-Session-Id': 'client-session-789',
          }),
          body: JSON.stringify(requestBody),
        })
      );
      expect(response).toBe(mockResponse);
    });

    it('stores client session id returned from streaming responses', async () => {
      const mockResponse = new Response('stream', {
        headers: {
          'X-Client-Session-Id': 'server-stream-session',
        },
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);
      localStorage.setItem('token', 'abc');

      await ollama.generate(requestBody);

      expect(localStorage.getItem('clientSessionId')).toBe('server-stream-session');
    });

    it('refreshes tokens and retries generate requests on 401', async () => {
      const unauthorizedResponse = new Response(null, {
        status: 401,
        statusText: 'Unauthorized',
      });
      const okResponse = new Response('stream');
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(unauthorizedResponse)
        .mockResolvedValueOnce(okResponse);
      localStorage.setItem('token', 'expired');
      localStorage.setItem('refreshToken', 'refresh-token');
      const refreshSpy = vi.spyOn(auth, 'refresh').mockResolvedValue({
        data: {
          token: 'new-stream-token',
          refreshToken: 'new-refresh-token',
        },
      } as any);

      const response = await ollama.generate(requestBody);

      expect(refreshSpy).toHaveBeenCalledWith({ refreshToken: 'refresh-token' });
      expect(response).toBe(okResponse);
      expect(global.fetch).toHaveBeenLastCalledWith(
        `${apiBase}/api/v1/ollama/generate`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer new-stream-token',
          }),
        })
      );
      expect(localStorage.getItem('token')).toBe('new-stream-token');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
      refreshSpy.mockRestore();
    });

    it('clears auth and redirects when generate receives 401 without a refresh token', async () => {
      const unauthorizedResponse = new Response(null, {
        status: 401,
        statusText: 'Unauthorized',
      });
      vi.mocked(global.fetch).mockResolvedValue(unauthorizedResponse);
      localStorage.setItem('token', 'abc');
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      await expect(ollama.generate(requestBody)).rejects.toThrow(
        'Failed to fetch stream: Unauthorized'
      );
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(window.location.href).toBe('/login');

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('does not retry a stream with the stale token when the refresh fails', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(null, { status: 401, statusText: 'Unauthorized' })
      );
      localStorage.setItem('token', 'expired');
      localStorage.setItem('refreshToken', 'revoked-refresh-token');
      const refreshSpy = vi.spyOn(auth, 'refresh').mockRejectedValue(new Error('refresh rejected'));
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      await expect(ollama.generate(requestBody)).rejects.toThrow('Failed to refresh session');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(refreshSpy).toHaveBeenCalledWith({ refreshToken: 'revoked-refresh-token' });
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(window.location.href).toBe('/login');

      refreshSpy.mockRestore();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('clears auth and redirects when a stream is forbidden', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(null, { status: 403, statusText: 'Forbidden' })
      );
      localStorage.setItem('token', 'abc');
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      await expect(ollama.generate(requestBody)).rejects.toThrow('Failed to fetch stream: Forbidden');
      expect(localStorage.getItem('token')).toBeNull();
      expect(window.location.href).toBe('/login');

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('keeps the session when a stream fails with a server error', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(null, { status: 500, statusText: 'Internal Server Error' })
      );
      localStorage.setItem('token', 'abc');
      localStorage.setItem('refreshToken', 'refresh-token');
      const refreshSpy = vi.spyOn(auth, 'refresh');
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      await expect(ollama.generate(requestBody)).rejects.toThrow(
        'Failed to fetch stream: Internal Server Error'
      );
      expect(refreshSpy).not.toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBe('abc');
      expect(window.location.href).toBe('http://localhost/');

      refreshSpy.mockRestore();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('sends chat requests with auth header', async () => {
      const mockResponse = new Response('stream');
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);
      localStorage.setItem('token', 'xyz');
      const chatBody = { model: 'qwen', messages: [], think: true, options: { temperature: 0.7 } };

      await ollama.chat(chatBody);

      expect(global.fetch).toHaveBeenCalledWith(
        `${apiBase}/api/v1/ollama/chat`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer xyz',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(chatBody),
        })
      );
    });
  });
});
