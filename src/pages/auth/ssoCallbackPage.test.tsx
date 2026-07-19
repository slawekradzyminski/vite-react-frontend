import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SsoCallbackPage } from './ssoCallbackPage';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockSetTokens = vi.hoisted(() => vi.fn());
const mockClearCallbackState = vi.hoisted(() => vi.fn());
const mockCompleteCallback = vi.hoisted(() => vi.fn());
const mockConsumeLoginReturnTo = vi.hoisted(() => vi.fn());
const mockNavigateAfterLogin = vi.hoisted(() => vi.fn());

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
    consumeLoginReturnTo: mockConsumeLoginReturnTo,
  },
}));

vi.mock('../../lib/loginNavigation', () => ({
  navigateAfterLogin: mockNavigateAfterLogin,
}));

describe('SsoCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsumeLoginReturnTo.mockReturnValue('/');
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
      expect(mockNavigateAfterLogin).toHaveBeenCalledWith('/', expect.any(Function));
    });
  });

  it('consumes and forwards a deep AI Lab return after SSO', async () => {
    mockConsumeLoginReturnTo.mockReturnValue('/learn/agent-loop');
    mockCompleteCallback.mockResolvedValue({
      token: 'test-token',
      refreshToken: 'test-refresh',
      roles: [],
    });

    render(<SsoCallbackPage />);

    await waitFor(() => {
      expect(mockConsumeLoginReturnTo).toHaveBeenCalledOnce();
      expect(mockNavigateAfterLogin).toHaveBeenCalledWith('/learn/agent-loop', expect.any(Function));
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
