import { describe, it, expect, vi, afterEach } from 'vitest';
import { auth } from './api';
import { Role } from '../types/auth';
import { qr } from './api';

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

describe('auth API', () => {
  afterEach(() => {
    vi.clearAllMocks();
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
    vi.clearAllMocks();
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
}); 