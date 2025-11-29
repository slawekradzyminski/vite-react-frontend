import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginPage } from './loginPage';
import { Role } from '../../types/auth';
import { AxiosResponse } from 'axios';

// Mock API first, before any variable declarations
vi.mock('../../lib/api', () => ({
  auth: {
    login: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock toast functionality
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Variable declarations after all mocks
const mockNavigate = vi.fn();
const mockLocation = { state: null };
const mockToast = vi.fn();

describe('LoginPage', () => {
  // given
  let user;
  
  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    mockLocation.state = null;
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders the login form correctly', () => {
    // when
    render(<LoginPage />);
    
    // then
    expect(screen.getByTestId('login-title')).toBeInTheDocument();
    expect(screen.getByTestId('login-username-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('login-register-link')).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    // given
    render(<LoginPage />);
    
    // when
    await user.click(screen.getByTestId('login-submit-button'));
    
    // then
    await waitFor(() => {
      expect(screen.getByTestId('login-username-error')).toBeInTheDocument();
      expect(screen.getByTestId('login-password-error')).toBeInTheDocument();
    });
  });

  it('displays validation errors for short username', async () => {
    // given
    render(<LoginPage />);
    
    // when
    await user.type(screen.getByTestId('login-username-input'), 'abc');
    await user.type(screen.getByTestId('login-password-input'), 'password123');
    await user.click(screen.getByTestId('login-submit-button'));
    
    // then
    await waitFor(() => {
      expect(screen.getByTestId('login-username-error')).toHaveTextContent('Username must be at least 4 characters');
    });
  });

  it('displays validation errors for short password', async () => {
    // given
    render(<LoginPage />);
    
    // when
    await user.type(screen.getByTestId('login-username-input'), 'validusername');
    await user.type(screen.getByTestId('login-password-input'), 'abc');
    await user.click(screen.getByTestId('login-submit-button'));
    
    // then
    await waitFor(() => {
      expect(screen.getByTestId('login-password-error')).toHaveTextContent('Password must be at least 4 characters');
    });
  });

  it('submits the form with valid credentials and redirects to home', async () => {
    // given
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.login).mockResolvedValue({ 
      data: { 
        token: 'test-token',
        refreshToken: 'test-refresh',
        username: 'validuser',
        email: 'valid@example.com',
        firstName: 'Valid',
        lastName: 'User',
        roles: [Role.CLIENT]
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    } as AxiosResponse);
    render(<LoginPage />);
    
    // when
    await user.type(screen.getByTestId('login-username-input'), 'validuser');
    await user.type(screen.getByTestId('login-password-input'), 'validpassword');
    await user.click(screen.getByTestId('login-submit-button'));
    
    // then
    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith({
        username: 'validuser',
        password: 'validpassword',
      });
      expect(window.localStorage.setItem).toHaveBeenNthCalledWith(1, 'token', 'test-token');
      expect(window.localStorage.setItem).toHaveBeenNthCalledWith(2, 'refreshToken', 'test-refresh');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error toast on invalid credentials', async () => {
    // given
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.login).mockRejectedValue({
      response: { status: 422 }
    });
    render(<LoginPage />);
    
    // when
    await user.type(screen.getByTestId('login-username-input'), 'wronguser');
    await user.type(screen.getByTestId('login-password-input'), 'wrongpass');
    await user.click(screen.getByTestId('login-submit-button'));
    
    // then
    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith({
        username: 'wronguser',
        password: 'wrongpass',
      });
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'error',
        title: 'Error',
        description: 'Invalid username/password',
      });
    });
  });

  it('shows error toast on server error', async () => {
    // given
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.login).mockRejectedValue({
      response: { 
        status: 500,
        data: { message: 'Server error occurred' } 
      }
    });
    render(<LoginPage />);
    
    // when
    await user.type(screen.getByTestId('login-username-input'), 'validuser');
    await user.type(screen.getByTestId('login-password-input'), 'validpassword');
    await user.click(screen.getByTestId('login-submit-button'));
    
    // then
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'error',
        title: 'Error',
        description: 'Server error occurred',
      });
    });
  });

  it('navigates to register page when register link is clicked', async () => {
    // given
    render(<LoginPage />);
    
    // when
    await user.click(screen.getByTestId('login-register-link'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('displays toast from location state if present', async () => {
    // given
    mockLocation.state = { 
      toast: { 
        title: 'Success', 
        description: 'Account created successfully', 
        variant: 'success' 
      } 
    } as any; // Type assertion to avoid type error
    
    // Mock history.replaceState
    window.history.replaceState = vi.fn();
    
    // when
    render(<LoginPage />);
    
    // then
    expect(mockToast).toHaveBeenCalledWith((mockLocation.state as any)?.toast);
    expect(window.history.replaceState).toHaveBeenCalled();
  });
}); 
