import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RegisterPage } from './registerPage';
import { Role } from '../../types/auth';
import { AxiosResponse } from 'axios';

// Mock API first, before any variable declarations
vi.mock('../../lib/api', () => ({
  auth: {
    register: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock toast functionality
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Variable declarations after all mocks
const mockNavigate = vi.fn();
const mockToast = vi.fn();

describe('RegisterPage', () => {
  // given
  let user;
  
  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  it('renders the registration form correctly', () => {
    // when
    render(<RegisterPage />);
    
    // then
    expect(screen.getByTestId('register-title')).toBeInTheDocument();
    expect(screen.getByTestId('register-username-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-firstname-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-lastname-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('register-login-link')).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    // given
    render(<RegisterPage />);
    
    // when
    await user.click(screen.getByTestId('register-submit-button'));
    
    // then
    await waitFor(() => {
      expect(screen.getByTestId('register-username-error')).toBeInTheDocument();
      expect(screen.getByTestId('register-email-error')).toBeInTheDocument();
      expect(screen.getByTestId('register-password-error')).toBeInTheDocument();
      expect(screen.getByTestId('register-firstname-error')).toBeInTheDocument();
      expect(screen.getByTestId('register-lastname-error')).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid email format', async () => {
    // given
    render(<RegisterPage />);
    
    // when
    await user.type(screen.getByTestId('register-email-input'), 'invalid-email');
    await user.click(screen.getByTestId('register-submit-button'));
    
    // then
    await waitFor(() => {
      expect(screen.getByTestId('register-email-error')).toHaveTextContent('Invalid email format');
    });
  });

  it('displays validation error for short username', async () => {
    // given
    render(<RegisterPage />);
    
    // when
    await user.type(screen.getByTestId('register-username-input'), 'abc');
    await user.click(screen.getByTestId('register-submit-button'));
    
    // then
    await waitFor(() => {
      expect(screen.getByTestId('register-username-error')).toHaveTextContent('Username must be at least 4 characters');
    });
  });

  it('displays validation error for short password', async () => {
    // given
    render(<RegisterPage />);
    
    // when
    await user.type(screen.getByTestId('register-password-input'), '1234567');
    await user.click(screen.getByTestId('register-submit-button'));
    
    // then
    await waitFor(() => {
      expect(screen.getByTestId('register-password-error')).toHaveTextContent('Password must be at least 8 characters');
    });
  });

  it('submits the form with valid data and redirects to login', async () => {
    // given
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.register).mockResolvedValue({
      data: 'Registration successful',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    } as AxiosResponse);
    render(<RegisterPage />);
    
    // when
    await user.type(screen.getByTestId('register-username-input'), 'testuser');
    await user.type(screen.getByTestId('register-email-input'), 'test@example.com');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('register-firstname-input'), 'Test');
    await user.type(screen.getByTestId('register-lastname-input'), 'User');
    await user.click(screen.getByTestId('register-submit-button'));
    
    // then
    await waitFor(() => {
      expect(auth.register).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        roles: [Role.CLIENT],
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login', { 
        state: { 
          toast: { 
            variant: 'success', 
            title: 'Success', 
            description: 'Registration successful! You can now log in.' 
          } 
        } 
      });
    });
  });

  it('shows error toast when username is already in use', async () => {
    // given
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.register).mockRejectedValue({
      response: { 
        data: { 
          message: 'Username already in use' 
        } 
      }
    });
    render(<RegisterPage />);
    
    // when
    await user.type(screen.getByTestId('register-username-input'), 'existinguser');
    await user.type(screen.getByTestId('register-email-input'), 'test@example.com');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('register-firstname-input'), 'Test');
    await user.type(screen.getByTestId('register-lastname-input'), 'User');
    await user.click(screen.getByTestId('register-submit-button'));
    
    // then
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'error',
        title: 'Error',
        description: 'Username already exists',
      });
    });
  });

  it('shows general error message for other API errors', async () => {
    // given
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.register).mockRejectedValue({
      response: { 
        data: { 
          message: 'Server error' 
        } 
      }
    });
    render(<RegisterPage />);
    
    // when
    await user.type(screen.getByTestId('register-username-input'), 'testuser');
    await user.type(screen.getByTestId('register-email-input'), 'test@example.com');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('register-firstname-input'), 'Test');
    await user.type(screen.getByTestId('register-lastname-input'), 'User');
    await user.click(screen.getByTestId('register-submit-button'));
    
    // then
    await waitFor(() => {
      expect(screen.getByTestId('register-submit-error')).toHaveTextContent('Server error');
    });
  });

  it('navigates to login page when sign in link is clicked', async () => {
    // given
    render(<RegisterPage />);
    
    // when
    await user.click(screen.getByTestId('register-login-link'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
}); 