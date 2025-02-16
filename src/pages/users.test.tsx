import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { auth } from '../lib/api';
import { renderWithProviders } from '../test/test-utils';
import { UsersPage } from './users';
import { Role } from '../types/auth';

vi.mock('../lib/api', () => ({
  auth: {
    me: vi.fn(),
    getUsers: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

describe('UsersPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // given
  it('shows loading state while fetching users', () => {
    // when
    vi.mocked(auth.me).mockResolvedValue({
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: [Role.ADMIN],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    vi.mocked(auth.getUsers).mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<UsersPage />);

    // then
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  // given
  it('shows users list for admin user', async () => {
    // when
    vi.mocked(auth.me).mockResolvedValueOnce({
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: [Role.ADMIN],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    vi.mocked(auth.getUsers).mockResolvedValueOnce({
      data: [
        {
          id: 2,
          username: 'user1',
          email: 'user1@example.com',
          firstName: 'Test',
          lastName: 'User',
          roles: [Role.CLIENT],
        },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<UsersPage />);

    // then
    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    const userHeading = screen.getByRole('heading', { name: /test user/i });
    expect(userHeading).toBeInTheDocument();
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  // given
  it('hides edit/delete buttons for non-admin user', async () => {
    // when
    vi.mocked(auth.me).mockResolvedValueOnce({
      data: {
        id: 1,
        username: 'client',
        email: 'client@example.com',
        firstName: 'Client',
        lastName: 'User',
        roles: [Role.CLIENT],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    vi.mocked(auth.getUsers).mockResolvedValueOnce({
      data: [
        {
          id: 2,
          username: 'user1',
          email: 'user1@example.com',
          firstName: 'Test',
          lastName: 'User',
          roles: [Role.CLIENT],
        },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<UsersPage />);

    // then
    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    const userHeading = screen.getByRole('heading', { name: /test user/i });
    expect(userHeading).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  // given
  it('handles user deletion', async () => {
    // when
    vi.mocked(auth.me).mockResolvedValueOnce({
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: [Role.ADMIN],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    vi.mocked(auth.getUsers).mockResolvedValueOnce({
      data: [
        {
          id: 2,
          username: 'user1',
          email: 'user1@example.com',
          firstName: 'Test',
          lastName: 'User',
          roles: [Role.CLIENT],
        },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    vi.mocked(auth.deleteUser).mockResolvedValueOnce({
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockReturnValue(true);

    renderWithProviders(<UsersPage />);

    // then
    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();

    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(auth.deleteUser).toHaveBeenCalledWith('user1');
  });
}); 