import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UsersPage } from './usersPage';
import { Role } from '../../types/auth';

// Mock API first, before any variable declarations
vi.mock('../../lib/api', () => ({
  auth: {
    me: vi.fn(),
    getUsers: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Variable declarations after all mocks
const mockNavigate = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
};

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => {
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
    return { data: null, isLoading: false, error: null };
  },
  useMutation: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
    onSuccess: () => {
      mockInvalidateQueries({ queryKey: ['users'] });
    },
  }),
  useQueryClient: () => mockQueryClient,
}));

// Mock data
let mockCurrentUser = { data: { roles: [Role.ADMIN] } };
let mockUsers = [
  { id: 1, username: 'john', firstName: 'John', lastName: 'Doe', email: 'john@example.com', roles: [Role.ADMIN] },
  { id: 2, username: 'jane', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', roles: [Role.CLIENT] },
];
let mockIsLoadingUsers = false;
let mockUsersError: Error | null = null;
let mockDeleteMutate = vi.fn();

// Mock window.confirm
window.confirm = vi.fn(() => true);

describe('UsersPage', () => {
  // given
  let user;
  
  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    mockCurrentUser = { data: { roles: [Role.ADMIN] } };
    mockUsers = [
      { id: 1, username: 'john', firstName: 'John', lastName: 'Doe', email: 'john@example.com', roles: [Role.ADMIN] },
      { id: 2, username: 'jane', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', roles: [Role.CLIENT] },
    ];
    mockIsLoadingUsers = false;
    mockUsersError = null;
    mockDeleteMutate = vi.fn();
  });

  it('renders the users page title', () => {
    // when
    render(<UsersPage />);
    
    // then
    expect(screen.getByTestId('users-title')).toBeInTheDocument();
    expect(screen.getByTestId('users-title')).toHaveTextContent('Users');
  });

  it('shows loading state when users are being loaded', () => {
    // given
    mockIsLoadingUsers = true;
    
    // when
    render(<UsersPage />);
    
    // then
    expect(screen.getByTestId('users-loading')).toBeInTheDocument();
    expect(screen.getByTestId('users-loading')).toHaveTextContent('Loading users...');
  });

  it('shows error message when users fetch fails', () => {
    // given
    mockUsersError = new Error('Failed to fetch users');
    
    // when
    render(<UsersPage />);
    
    // then
    expect(screen.getByTestId('users-error')).toBeInTheDocument();
    expect(screen.getByTestId('users-error')).toHaveTextContent('Failed to load users');
  });

  it('renders list of users when data is available', () => {
    // when
    render(<UsersPage />);
    
    // then
    expect(screen.getByTestId('users-list')).toBeInTheDocument();
    expect(screen.getByTestId('user-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('user-name-1')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('user-name-2')).toHaveTextContent('Jane Smith');
    expect(screen.getByTestId('user-email-1')).toHaveTextContent('john@example.com');
    expect(screen.getByTestId('user-email-2')).toHaveTextContent('jane@example.com');
    expect(screen.getByTestId('user-username-1')).toHaveTextContent('john');
    expect(screen.getByTestId('user-username-2')).toHaveTextContent('jane');
  });

  it('displays admin actions when user is an admin', () => {
    // given
    mockCurrentUser = { data: { roles: [Role.ADMIN] } };
    
    // when
    render(<UsersPage />);
    
    // then
    expect(screen.getByTestId('user-actions-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-actions-2')).toBeInTheDocument();
    expect(screen.getByTestId('user-edit-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-delete-1')).toBeInTheDocument();
  });

  it('does not display admin actions when user is not an admin', () => {
    // given
    mockCurrentUser = { data: { roles: [Role.CLIENT] } };
    
    // when
    render(<UsersPage />);
    
    // then
    expect(screen.queryByTestId('user-actions-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-actions-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-edit-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-delete-1')).not.toBeInTheDocument();
  });

  it('navigates to edit user page when edit button is clicked', async () => {
    // given
    render(<UsersPage />);
    
    // when
    await user.click(screen.getByTestId('user-edit-1'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/users/john/edit');
  });

  it('deletes a user when delete button is clicked and confirmed', async () => {
    // given
    render(<UsersPage />);
    
    // when
    await user.click(screen.getByTestId('user-delete-1'));
    
    // then
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteMutate).toHaveBeenCalledWith('john');
  });

  it('does not delete a user when delete button is clicked but not confirmed', async () => {
    // given
    window.confirm = vi.fn(() => false);
    render(<UsersPage />);
    
    // when
    await user.click(screen.getByTestId('user-delete-1'));
    
    // then
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it('navigates to home page when back button is clicked', async () => {
    // given
    render(<UsersPage />);
    
    // when
    await user.click(screen.getByTestId('users-back-button'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
}); 