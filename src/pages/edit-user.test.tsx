import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { auth } from '../lib/api';
import { renderWithProviders } from '../test/test-utils';
import { EditUserPage } from './edit-user';
import { Role } from '../types/auth';

vi.mock('../lib/api', () => ({
  auth: {
    me: vi.fn(),
    getUsers: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ username: 'user1' }),
  };
});

describe('EditUserPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // given
  it('shows loading state while fetching user', () => {
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

    renderWithProviders(<EditUserPage />);

    // then
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  // given
  it('shows user form for admin user', async () => {
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

    renderWithProviders(<EditUserPage />);

    // then
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });

    expect(emailInput).toHaveValue('user1@example.com');
    expect(firstNameInput).toHaveValue('Test');
    expect(lastNameInput).toHaveValue('User');
  });

  // given
  it('shows access denied for non-admin user', async () => {
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

    renderWithProviders(<EditUserPage />);

    // then
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  // given
  it('handles user update', async () => {
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

    vi.mocked(auth.updateUser).mockResolvedValueOnce({
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<EditUserPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });

    await user.clear(emailInput);
    await user.type(emailInput, 'updated@example.com');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Updated');
    await user.clear(lastNameInput);
    await user.type(lastNameInput, 'Name');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // then
    expect(auth.updateUser).toHaveBeenCalledWith('user1', {
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'Name',
    });
  });
}); 