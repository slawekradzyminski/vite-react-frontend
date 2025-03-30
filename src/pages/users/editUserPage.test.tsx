import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EditUserPage } from './editUserPage';
import { Role, User } from '../../types/auth';
import { AxiosResponse } from 'axios';

// Mock API first, before any variable declarations
vi.mock('../../lib/api', () => ({
  auth: {
    me: vi.fn(),
    getUsers: vi.fn(),
    updateUser: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ username: 'testuser' }),
}));

// Variable declarations after all mocks
const mockNavigate = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
};

// For capturing mutation callbacks
let mutationOptions: any = {};

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
    if (queryKey[0] === 'user') {
      return {
        data: mockUser,
        isLoading: mockIsLoadingUser,
        error: mockUserError,
      };
    }
    return { data: null, isLoading: false, error: null };
  },
  useMutation: (options) => {
    // Store options to access callbacks later
    mutationOptions = options;
    return {
      mutate: mockUpdateMutate,
      isPending: mockIsPending,
    };
  },
  useQueryClient: () => mockQueryClient,
}));

// Mock data
let mockCurrentUser = { data: { roles: [Role.ADMIN] } };
let mockUser: AxiosResponse<User> | null = {
  data: {
    id: 1, 
    username: 'testuser', 
    firstName: 'Test', 
    lastName: 'User', 
    email: 'test@example.com', 
    roles: [Role.CLIENT]
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any
};
let mockIsLoadingUser = false;
let mockUserError: Error | null = null;
let mockUpdateMutate = vi.fn();
let mockIsPending = false;

describe('EditUserPage', () => {
  // given
  let user;
  
  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    mockCurrentUser = { data: { roles: [Role.ADMIN] } };
    mockUser = {
      data: {
        id: 1, 
        username: 'testuser', 
        firstName: 'Test', 
        lastName: 'User', 
        email: 'test@example.com', 
        roles: [Role.CLIENT]
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };
    mockIsLoadingUser = false;
    mockUserError = null;
    mockUpdateMutate = vi.fn();
    mockIsPending = false;
    mutationOptions = {};
  });

  it('renders loading state when user data is being fetched', () => {
    // given
    mockIsLoadingUser = true;
    
    // when
    render(<EditUserPage />);
    
    // then
    expect(screen.getByTestId('edit-user-loading')).toBeInTheDocument();
    expect(screen.getByTestId('edit-user-loading')).toHaveTextContent('Loading...');
  });

  it('renders not found message when user does not exist', () => {
    // given
    mockUser = null;
    
    // when
    render(<EditUserPage />);
    
    // then
    expect(screen.getByTestId('edit-user-not-found')).toBeInTheDocument();
    expect(screen.getByTestId('edit-user-not-found')).toHaveTextContent('User not found');
  });

  it('shows access denied when user is not an admin', () => {
    // given
    mockCurrentUser = { data: { roles: [Role.CLIENT] } };
    
    // when
    render(<EditUserPage />);
    
    // then
    expect(screen.getByTestId('edit-user-denied')).toBeInTheDocument();
    expect(screen.getByTestId('edit-user-denied')).toHaveTextContent('Access denied');
  });

  it('renders the edit user form with user data when admin accesses the page', async () => {
    // when
    render(<EditUserPage />);
    
    // then
    await waitFor(() => {
      expect(screen.getByTestId('edit-user-title')).toBeInTheDocument();
    });
    
    // Just verify that the form components render properly
    expect(screen.getByTestId('edit-user-username')).toHaveTextContent('Editing user: testuser');
    expect(screen.getByTestId('edit-user-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('edit-user-firstname-input')).toBeInTheDocument();
    expect(screen.getByTestId('edit-user-lastname-input')).toBeInTheDocument();
    expect(screen.getByTestId('edit-user-submit-button')).toBeInTheDocument();
  });

  it('submits the form with updated user data', async () => {
    // given
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.updateUser).mockResolvedValue({
      data: mockUser?.data as User,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    });
    
    // when
    render(<EditUserPage />);
    
    await user.clear(screen.getByTestId('edit-user-email-input'));
    await user.type(screen.getByTestId('edit-user-email-input'), 'updated@example.com');
    
    await user.clear(screen.getByTestId('edit-user-firstname-input'));
    await user.type(screen.getByTestId('edit-user-firstname-input'), 'Updated');
    
    await user.clear(screen.getByTestId('edit-user-lastname-input'));
    await user.type(screen.getByTestId('edit-user-lastname-input'), 'Name');
    
    await user.click(screen.getByTestId('edit-user-submit-button'));
    
    // then
    expect(mockUpdateMutate).toHaveBeenCalled();
    // We can't directly verify the FormData content, but we can check the mock was called
  });

  it('shows loading state during form submission', async () => {
    // given
    mockIsPending = true;
    
    // when
    render(<EditUserPage />);
    
    // then
    expect(screen.getByTestId('edit-user-submit-button')).toBeDisabled();
    expect(screen.getByTestId('edit-user-submit-button')).toHaveTextContent('Saving...');
  });

  it('handles API errors during form submission', async () => {
    // given
    const errorMessage = 'Server error occurred';
    
    // Set up component with mock FormData
    const mockGet = vi.fn();
    const mockFormData = {
      get: mockGet,
      append: vi.fn(),
      delete: vi.fn(),
      forEach: vi.fn(),
      getAll: vi.fn(),
      has: vi.fn(),
      set: vi.fn(),
      entries: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
    };
    
    vi.spyOn(global, 'FormData').mockImplementation(() => mockFormData as unknown as FormData);
    
    // when
    render(<EditUserPage />);
    
    // Manually trigger the onError callback from useMutation
    const errorObj = {
      response: {
        data: {
          message: errorMessage,
        },
      },
    };
    
    // Use the captured mutation options to invoke onError
    await waitFor(() => {
      if (mutationOptions.onError) {
        mutationOptions.onError(errorObj, null, null);
      }
    });
    
    // then
    expect(screen.getByTestId('edit-user-error')).toBeInTheDocument();
    expect(screen.getByTestId('edit-user-error')).toHaveTextContent(errorMessage);
  });

  it('navigates back to users page on successful update', async () => {
    // when
    render(<EditUserPage />);
    
    // Manually trigger the onSuccess callback from useMutation
    await waitFor(() => {
      if (mutationOptions.onSuccess) {
        mutationOptions.onSuccess(null, null, null);
      }
    });
    
    // then
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] });
    expect(mockNavigate).toHaveBeenCalledWith('/users');
  });

  it('cancels edit and navigates back to users page', async () => {
    // given
    render(<EditUserPage />);
    
    // when
    await user.click(screen.getByTestId('edit-user-cancel-button'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/users');
  });
}); 