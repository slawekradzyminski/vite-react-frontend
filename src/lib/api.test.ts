import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth, ollama, qr } from './api';
import { Role } from '../types/auth';

const mockAxios = vi.hoisted(() => {
  const instance: any = vi.fn(() => Promise.resolve({ data: {} }));
  instance.interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  instance.post = vi.fn();
  instance.get = vi.fn();
  instance.put = vi.fn();
  instance.delete = vi.fn();
  instance.defaults = { baseURL: 'http://localhost:4001' };
  instance.create = vi.fn(() => instance);
  return instance;
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
      const calls = mockAxios.interceptors.request.use.mock.calls;
      const call = calls[calls.length - 1];
      if (!call) {
        throw new Error('Request interceptor was not registered');
      }
      return call[0];
    };

    const getErrorInterceptor = () => {
      const calls = mockAxios.interceptors.response.use.mock.calls;
      const call = calls[calls.length - 1];
      if (!call) {
        throw new Error('Response interceptor was not registered');
      }
      return call[1];
    };

    it('attaches bearer token for protected requests', () => {
      const requestInterceptor = getRequestInterceptor();
      localStorage.setItem('token', 'test-token');

      const config = requestInterceptor({
        url: '/api/v1/orders',
        headers: {},
      });

      expect(config.headers.Authorization).toBe('Bearer test-token');
    });

    it('skips auth header for public endpoints', () => {
      const requestInterceptor = getRequestInterceptor();
      localStorage.setItem('token', 'test-token');

      const config = requestInterceptor({
        url: '/api/v1/users/signin',
        headers: {},
      });

      expect(config.headers.Authorization).toBeUndefined();
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

      const response = await ollama.generate(requestBody);

      expect(global.fetch).toHaveBeenCalledWith(
        `${apiBase}/api/v1/ollama/generate`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer abc',
          }),
          body: JSON.stringify(requestBody),
        })
      );
      expect(response).toBe(mockResponse);
    });

    it('clears auth and redirects when generate receives 401', async () => {
      const unauthorizedResponse = new Response(null, {
        status: 401,
        statusText: 'Unauthorized',
      });
      vi.mocked(global.fetch).mockResolvedValue(unauthorizedResponse);
      localStorage.setItem('token', 'abc');
      localStorage.setItem('refreshToken', 'ref');
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
