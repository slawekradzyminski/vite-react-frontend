import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RegisterPage } from './registerPage';
import { AxiosResponse } from 'axios';

// Mock API first, before any variable declarations
vi.mock('../../lib/api', () => ({
  auth: {
    register: vi.fn(),
  },
}));

// Mock react-router
vi.mock('react-router', () => ({
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
    expect(screen.getByTestId('register-playground-notice')).toHaveTextContent('Training environment only');
  });

  it('exposes the page title as the only h1 and sets the document title', () => {
    // when
    render(<RegisterPage />);

    // then
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create your account');
    expect(document.title).toBe('Create account – Awesome Testing');
  });

  it('links each validation error to its field', async () => {
    // given
    render(<RegisterPage />);

    // when
    await user.click(screen.getByTestId('register-submit-button'));

    // then
    for (const field of ['username', 'email', 'password', 'firstname', 'lastname']) {
      const input = screen.getByTestId(`register-${field}-input`);
      const error = await screen.findByTestId(`register-${field}-error`);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', error.id);
      expect(input).toHaveAccessibleDescription(error.textContent!);
    }
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
      });
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'success',
        title: 'Success',
        description: 'Registration successful! You can now log in.',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login');
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

  it('shows error toast when email is already in use', async () => {
    // given
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.register).mockRejectedValue({
      response: {
        data: {
          message: 'Email is already in use'
        }
      }
    });
    render(<RegisterPage />);

    // when
    await user.type(screen.getByTestId('register-username-input'), 'newuser');
    await user.type(screen.getByTestId('register-email-input'), 'existing@example.com');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('register-firstname-input'), 'Test');
    await user.type(screen.getByTestId('register-lastname-input'), 'User');
    await user.click(screen.getByTestId('register-submit-button'));

    // then
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'error',
        title: 'Error',
        description: 'Email already exists',
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

  const fillValidForm = async (overrides: Partial<Record<'username' | 'email' | 'password' | 'firstname' | 'lastname', string>> = {}) => {
    const values = { username: 'testuser', email: 'test@example.com', password: 'password123', firstname: 'Test', lastname: 'User', ...overrides };
    for (const [field, value] of Object.entries(values)) {
      await user.type(screen.getByTestId(`register-${field}-input`), value);
    }
  };

  it('rejects a whitespace-only username on the client with the required message', async () => {
    const { auth } = await import('../../lib/api');
    render(<RegisterPage />);

    await fillValidForm({ username: '     ' });
    await user.click(screen.getByTestId('register-submit-button'));

    expect(await screen.findByTestId('register-username-error')).toHaveTextContent('Username is required');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('rejects username characters the backend does not accept', async () => {
    const { auth } = await import('../../lib/api');
    render(<RegisterPage />);

    await fillValidForm({ username: 'john doe' });
    await user.click(screen.getByTestId('register-submit-button'));

    expect(await screen.findByTestId('register-username-error'))
      .toHaveTextContent('Username may only contain letters, digits, dots, underscores and hyphens');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('sends the names and email trimmed but the password as typed', async () => {
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.register).mockResolvedValue({ data: 'ok' } as AxiosResponse);
    render(<RegisterPage />);

    await fillValidForm({ username: '  testuser ', email: ' test@example.com ', password: ' pass word1 ', firstname: ' Test ', lastname: ' User ' });
    await user.click(screen.getByTestId('register-submit-button'));

    await waitFor(() => expect(auth.register).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: ' pass word1 ',
      firstName: 'Test',
      lastName: 'User',
    }));
  });

  it('shows the server field errors under their fields instead of a generic failure', async () => {
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.register).mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { username: 'Minimum username length: 4 characters', lastName: 'lastName is required' } },
    });
    render(<RegisterPage />);

    await fillValidForm();
    await user.click(screen.getByTestId('register-submit-button'));

    expect(await screen.findByTestId('register-username-error')).toHaveTextContent('Minimum username length: 4 characters');
    expect(screen.getByTestId('register-lastname-error')).toHaveTextContent('lastName is required');
    expect(screen.getByTestId('register-username-input')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByTestId('register-submit-error')).not.toBeInTheDocument();
    expect(screen.queryByText('Failed to register')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows a server error that names no field in the form-level alert', async () => {
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.register).mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { roles: 'Roles cannot be chosen at sign-up' } },
    });
    render(<RegisterPage />);

    await fillValidForm();
    await user.click(screen.getByTestId('register-submit-button'));

    const alert = await screen.findByTestId('register-submit-error');
    expect(alert).toHaveTextContent('Roles cannot be chosen at sign-up');
    expect(alert).toHaveAttribute('role', 'alert');
  });

  it('navigates to login page when sign in link is clicked', async () => {
    // given
    render(<RegisterPage />);
    
    // when
    await user.click(screen.getByTestId('register-login-link'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('only navigates to login when Sign in is clicked on a filled form', async () => {
    // given
    const { auth } = await import('../../lib/api');
    render(<RegisterPage />);
    await user.type(screen.getByTestId('register-username-input'), 'testuser');
    await user.type(screen.getByTestId('register-email-input'), 'test@example.com');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('register-firstname-input'), 'Test');
    await user.type(screen.getByTestId('register-lastname-input'), 'User');

    // when
    await user.click(screen.getByTestId('register-login-link'));

    // then
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('lets browsers and password managers fill every field', () => {
    // when
    render(<RegisterPage />);

    // then
    expect(screen.getByTestId('register-username-input')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByTestId('register-email-input')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByTestId('register-password-input')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByTestId('register-firstname-input')).toHaveAttribute('autocomplete', 'given-name');
    expect(screen.getByTestId('register-lastname-input')).toHaveAttribute('autocomplete', 'family-name');
  });
});
