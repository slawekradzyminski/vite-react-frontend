import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { ForgotPasswordPage } from './forgotPasswordPage';

const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('../../lib/api', () => ({
  auth: {
    requestPasswordReset: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('ForgotPasswordPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  it('renders the form', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByTestId('forgot-title')).toBeInTheDocument();
    expect(screen.getByTestId('forgot-identifier-input')).toBeInTheDocument();
  });

  it('shows validation errors for empty identifier', async () => {
    render(<ForgotPasswordPage />);

    await user.click(screen.getByTestId('forgot-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-identifier-error')).toHaveTextContent('Username or email is required');
    });
  });

  it('submits the form and displays developer token when available', async () => {
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.requestPasswordReset).mockResolvedValue({
      data: { message: 'ok', token: 'test-token' },
    } as any);

    render(<ForgotPasswordPage />);

    await user.type(screen.getByTestId('forgot-identifier-input'), 'client');
    await user.click(screen.getByTestId('forgot-submit-button'));

    await waitFor(() => {
      expect(auth.requestPasswordReset).toHaveBeenCalledWith({
        identifier: 'client',
        resetBaseUrl: `${window.location.origin}/reset`,
      });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' })
      );
      expect(screen.getByTestId('forgot-token-value')).toHaveValue('test-token');
    });
  });

  it('shows error toast when API call fails', async () => {
    const { auth } = await import('../../lib/api');
    vi.mocked(auth.requestPasswordReset).mockRejectedValue({
      response: { data: { message: 'Failure' } },
    });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByTestId('forgot-identifier-input'), 'client');
    await user.click(screen.getByTestId('forgot-submit-button'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'error',
          description: 'Failure',
        })
      );
    });
  });
});
