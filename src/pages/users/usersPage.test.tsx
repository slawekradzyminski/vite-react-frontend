import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersPage } from './usersPage';
import { Role, type User } from '../../types/auth';

vi.mock('../../lib/api', () => ({
  auth: {
    me: vi.fn(),
    getUsers: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockInvalidateQueries = vi.fn();
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
};

const mockDeleteMutation = {
  mutate: vi.fn(),
  isPending: false,
};

const useQueryMock = vi.fn();
let deleteMutationOptions: any = {};

vi.mock('@tanstack/react-query', () => ({
  useQuery: (params: any) => useQueryMock(params),
  useMutation: (options: any) => {
    deleteMutationOptions = options;
    return mockDeleteMutation;
  },
  useQueryClient: () => mockQueryClient,
}));

const baseUsers: User[] = [
  { id: 1, username: 'john', firstName: 'John', lastName: 'Doe', email: 'john@example.com', roles: [Role.ADMIN] },
  { id: 2, username: 'jane', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', roles: [Role.CLIENT] },
];

let mockCurrentUser = { data: { roles: [Role.ADMIN] } };
let mockUsers: User[] | undefined = baseUsers;
let mockIsLoadingUsers = false;
let mockUsersError: Error | null = null;
const confirmSpy = vi.spyOn(window, 'confirm');

useQueryMock.mockImplementation(({ queryKey }) => {
  if (queryKey[0] === 'me') {
    return {
      data: mockCurrentUser,
      isLoading: false,
      error: null,
    };
  }

  if (queryKey[0] === 'users') {
    return {
      data: mockUsers,
      isLoading: mockIsLoadingUsers,
      error: mockUsersError,
    };
  }

  return { data: undefined, isLoading: false, error: null };
});

describe('UsersPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockCurrentUser = { data: { roles: [Role.ADMIN] } };
    mockUsers = baseUsers;
    mockIsLoadingUsers = false;
    mockUsersError = null;
    mockDeleteMutation.mutate = vi.fn();
    mockDeleteMutation.isPending = false;
    mockInvalidateQueries.mockClear();
    mockNavigate.mockClear();
    deleteMutationOptions = {};
    confirmSpy.mockReturnValue(true);
  });

  it('renders the users page title', () => {
    render(<UsersPage />);
    expect(screen.getByTestId('users-title')).toHaveTextContent('Users');
  });

  it('shows loading state when users are being loaded', () => {
    mockIsLoadingUsers = true;
    render(<UsersPage />);
    expect(screen.getByTestId('users-loading')).toHaveTextContent('Loading users...');
  });

  it('shows error message when users fetch fails', () => {
    mockUsersError = new Error('Failed to fetch users');
    render(<UsersPage />);
    expect(screen.getByTestId('users-error')).toHaveTextContent('Failed to load users');
  });

  it('renders list of users when data is available', () => {
    render(<UsersPage />);
    expect(screen.getByTestId('users-list')).toBeInTheDocument();
    expect(screen.getByTestId('user-name-1')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('user-name-2')).toHaveTextContent('Jane Smith');
  });

  it('displays admin actions when user is an admin', () => {
    render(<UsersPage />);
    expect(screen.getByTestId('user-actions-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-actions-2')).toBeInTheDocument();
  });

  it('hides admin actions when user lacks admin role', () => {
    mockCurrentUser = { data: { roles: [Role.CLIENT] } };
    render(<UsersPage />);
    expect(screen.queryByTestId('user-actions-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-actions-2')).not.toBeInTheDocument();
  });

  it('navigates to edit user page when edit button is clicked', async () => {
    render(<UsersPage />);
    await user.click(screen.getByTestId('user-edit-1'));
    expect(mockNavigate).toHaveBeenCalledWith('/users/john/edit');
  });

  it('invokes delete mutation when confirmation passes', async () => {
    render(<UsersPage />);
    await user.click(screen.getByTestId('user-delete-1'));
    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDeleteMutation.mutate).toHaveBeenCalledWith('john');
  });

  it('does not call delete mutation when confirmation is rejected', async () => {
    confirmSpy.mockReturnValue(false);
    render(<UsersPage />);
    await user.click(screen.getByTestId('user-delete-1'));
    expect(mockDeleteMutation.mutate).not.toHaveBeenCalled();
  });

  it('navigates back home when clicking the back button', async () => {
    render(<UsersPage />);
    await user.click(screen.getByTestId('users-back-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('disables delete button while mutation is pending', () => {
    mockDeleteMutation.isPending = true;
    render(<UsersPage />);
    expect(screen.getByTestId('user-delete-1')).toBeDisabled();
  });

  it('renders delete error message when mutation fails', async () => {
    render(<UsersPage />);
    await waitFor(() => {
      deleteMutationOptions.onError?.({
        response: { data: { message: 'Failed to delete user' } },
      });
    });
    expect(screen.getByTestId('users-delete-error')).toHaveTextContent('Failed to delete user');
  });

  it('clears error and invalidates queries when delete succeeds', async () => {
    render(<UsersPage />);
    await waitFor(() => {
      deleteMutationOptions.onSuccess?.();
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] });
    expect(screen.queryByTestId('users-delete-error')).not.toBeInTheDocument();
  });
});
