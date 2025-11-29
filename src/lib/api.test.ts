import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { auth, qr, ollama } from './api';
import { Role } from '../types/auth';

// Hoist mocks
const mockAxios = vi.hoisted(() => ({
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    ...mockAxios,
    create: vi.fn(() => mockAxios),
  },
}));

const originalFetch = global.fetch;

describe('auth API', () => {
  afterEach(() => {
    mockAxios.post.mockReset();
    mockAxios.get.mockReset();
    mockAxios.put.mockReset();
    mockAxios.delete.mockReset();
    localStorage.clear();
  });

  // given
  describe('login', () => {
    const loginData = {
      username: 'testuser',
      password: 'password123',
    };

    // when
    it('calls the correct endpoint with credentials', async () => {
      // then
      await auth.login(loginData);
      expect(mockAxios.post).toHaveBeenCalledWith('/users/signin', loginData);
    });
  });

  // given
  describe('register', () => {
    const registerData = {
      username: 'newuser',
      password: 'password123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: [Role.CLIENT],
    };

    // when
    it('calls the correct endpoint with user data', async () => {
      // then
      await auth.register(registerData);
      expect(mockAxios.post).toHaveBeenCalledWith('/users/signup', registerData);
    });
  });

  // given
  describe('getUsers', () => {
    // when
    it('calls the correct endpoint', async () => {
      // then
      await auth.getUsers();
      expect(mockAxios.get).toHaveBeenCalledWith('/users');
    });
  });

  // given
  describe('deleteUser', () => {
    // when
    it('calls the correct endpoint with username', async () => {
      const username = 'testuser';
      
      // then
      await auth.deleteUser(username);
      expect(mockAxios.delete).toHaveBeenCalledWith(`/users/${username}`);
    });
  });
});

describe('API Client', () => {
  beforeEach(() => {
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
    // given
    it('should generate QR code', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      mockAxios.post.mockResolvedValue({ data: mockBlob });

      // when
      const response = await qr.create({ text: 'test' });

      // then
      expect(mockAxios.post).toHaveBeenCalledWith('/qr/create', { text: 'test' }, { responseType: 'blob' });
      expect(response.type).toBe('image/png');
      expect(response.data).toBeInstanceOf(Blob);
    });

    // given
    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockAxios.post.mockRejectedValue(error);

      // when
      const promise = qr.create({ text: '' });

      // then
      await expect(promise).rejects.toThrow('API Error');
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
        url: '/api/orders',
        headers: {},
      });

      expect(config.headers.Authorization).toBe('Bearer test-token');
    });

    it('skips auth header for public endpoints', () => {
      const requestInterceptor = getRequestInterceptor();
      localStorage.setItem('token', 'test-token');

      const config = requestInterceptor({
        url: '/users/signin',
        headers: {},
      });

      expect(config.headers.Authorization).toBeUndefined();
    });

    it('clears token and redirects on unauthorized response', async () => {
      const errorInterceptor = getErrorInterceptor();
      localStorage.setItem('token', 'test-token');
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
        `${apiBase}/api/ollama/generate`,
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
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost/' } as Location,
      });

      await expect(ollama.generate(requestBody)).rejects.toThrow(
        'Failed to fetch stream: Unauthorized'
      );
      expect(localStorage.getItem('token')).toBeNull();
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
        `${apiBase}/api/ollama/chat`,
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
