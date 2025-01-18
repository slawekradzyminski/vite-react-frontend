import { describe, it, expect, vi, afterEach } from 'vitest';
import { auth } from './api';
import { Role } from '../types/auth';

const mockPost = vi.hoisted(() => vi.fn());
const mockGet = vi.hoisted(() => vi.fn());
const mockPut = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    create: () => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      post: mockPost,
      get: mockGet,
      put: mockPut,
      delete: mockDelete,
    }),
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
      expect(mockPost).toHaveBeenCalledWith('/users/signin', loginData);
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
      expect(mockPost).toHaveBeenCalledWith('/users/signup', registerData);
    });
  });

  // given
  describe('getUsers', () => {
    // when
    it('calls the correct endpoint', async () => {
      // then
      await auth.getUsers();
      expect(mockGet).toHaveBeenCalledWith('/users');
    });
  });

  // given
  describe('deleteUser', () => {
    // when
    it('calls the correct endpoint with username', async () => {
      const username = 'testuser';
      
      // then
      await auth.deleteUser(username);
      expect(mockDelete).toHaveBeenCalledWith(`/users/${username}`);
    });
  });
}); 