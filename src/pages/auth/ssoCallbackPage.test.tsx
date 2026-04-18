import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SsoCallbackPage } from './ssoCallbackPage';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockSetTokens = vi.hoisted(() => vi.fn());
const mockClearCallbackState = vi.hoisted(() => vi.fn());
const mockCompleteCallback = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../lib/authStorage', () => ({
  authStorage: {
    setTokens: mockSetTokens,
  },
}));

vi.mock('../../lib/sso', () => ({
  sso: {
    completeCallback: mockCompleteCallback,
    clearCallbackState: mockClearCallbackState,
  },
}));

describe('SsoCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exchanges the SSO token and redirects home', async () => {
    mockCompleteCallback.mockResolvedValue({
      token: 'test-token',
      refreshToken: 'test-refresh',
      username: 'alice',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      roles: [],
    });

    render(<SsoCallbackPage />);

    await waitFor(() => {
      expect(mockCompleteCallback).toHaveBeenCalled();
      expect(mockSetTokens).toHaveBeenCalledWith({
        token: 'test-token',
        refreshToken: 'test-refresh',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('shows an error and offers a way back when callback completion fails', async () => {
    mockCompleteCallback.mockRejectedValue(new Error('SSO state mismatch'));

    render(<SsoCallbackPage />);

    await waitFor(() => {
      expect(screen.getByTestId('sso-callback-message')).toHaveTextContent('SSO state mismatch');
      expect(screen.getByTestId('sso-callback-back-button')).toBeInTheDocument();
      expect(mockClearCallbackState).toHaveBeenCalled();
    });
  });
});
