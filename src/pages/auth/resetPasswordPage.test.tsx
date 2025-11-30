import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { ResetPasswordPage } from './resetPasswordPage';

const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockSearchParams = { get: vi.fn() };

vi.mock('../../lib/api', () => ({
  auth: {
    resetPassword: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('ResetPasswordPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    mockSearchParams.get.mockReturnValue(null);
  });

  it('prefills token when present in query string', async () => {
    mockSearchParams.get.mockReturnValue('query-token');

    render(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByTestId('reset-token-input')).toHaveValue('query-token');
    });
  });

  it('submits form and navigates to login on success', async () => {
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.resetPassword).mockResolvedValue({} as any);

    render(<ResetPasswordPage />);

    await user.type(screen.getByTestId('reset-token-input'), 'token');
    await user.type(screen.getByTestId('reset-password-input'), 'Password123');
    await user.type(screen.getByTestId('reset-confirm-password-input'), 'Password123');
    await user.click(screen.getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(auth.resetPassword).toHaveBeenCalledWith({
        token: 'token',
        newPassword: 'Password123',
        confirmPassword: 'Password123',
      });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/login', expect.any(Object));
    });
  });

  it('shows validation error when passwords do not match', async () => {
    render(<ResetPasswordPage />);

    await user.type(screen.getByTestId('reset-token-input'), 'token');
    await user.type(screen.getByTestId('reset-password-input'), 'Password123');
    await user.type(screen.getByTestId('reset-confirm-password-input'), 'Mismatch');
    await user.click(screen.getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('reset-confirm-password-error')).toHaveTextContent('Passwords must match');
    });
  });

  it('shows error toast when API call fails', async () => {
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.resetPassword).mockRejectedValue({
      response: { data: { message: 'Token expired' } },
    });

    render(<ResetPasswordPage />);

    await user.type(screen.getByTestId('reset-token-input'), 'token');
    await user.type(screen.getByTestId('reset-password-input'), 'Password123');
    await user.type(screen.getByTestId('reset-confirm-password-input'), 'Password123');
    await user.click(screen.getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'error',
          description: 'Token expired',
        })
      );
    });
  });
});
