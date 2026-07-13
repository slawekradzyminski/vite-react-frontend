import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '../../lib/api';
import { MfaSecurityPanel } from './MfaSecurityPanel';

const mockToast = vi.fn();

vi.mock('../../lib/api', () => ({
  auth: {
    mfa: {
      status: vi.fn(),
      setup: vi.fn(),
      confirm: vi.fn(),
      regenerateRecoveryCodes: vi.fn(),
      disable: vi.fn(),
    },
  },
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const response = <T,>(data: T) => ({ data }) as AxiosResponse<T>;

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MfaSecurityPanel />
    </QueryClientProvider>,
  );
}

describe('MfaSecurityPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enrolls an authenticator and displays one-time recovery codes', async () => {
    const user = userEvent.setup();
    vi.mocked(auth.mfa.status)
      .mockResolvedValueOnce(response({ enabled: false, unusedRecoveryCodes: 0 }))
      .mockResolvedValueOnce(response({ enabled: true, unusedRecoveryCodes: 10 }));
    vi.mocked(auth.mfa.setup).mockResolvedValue(response({
      secret: 'JBSWY3DPEHPK3PXP',
      otpAuthUri: 'otpauth://totp/LocalTalk:testuser',
      qrCodeDataUri: 'data:image/png;base64,cXItY29kZQ==',
      expiresAt: '2026-07-13T12:15:00Z',
    }));
    vi.mocked(auth.mfa.confirm).mockResolvedValue(response({
      recoveryCodes: ['AAAA-BBBB-CCCC-DDDD-EEEE', 'FFFF-GGGG-HHHH-IIII-JJJJ'],
    }));
    renderPanel();

    await user.click(await screen.findByTestId('mfa-enable-button'));
    expect(await screen.findByTestId('mfa-setup-qr')).toHaveAttribute('src', 'data:image/png;base64,cXItY29kZQ==');
    expect(screen.getByTestId('mfa-manual-key')).toHaveValue('JBSWY3DPEHPK3PXP');

    await user.type(screen.getByTestId('mfa-confirm-code'), '123456');
    await user.click(screen.getByTestId('mfa-confirm-button'));

    await waitFor(() => expect(auth.mfa.confirm).toHaveBeenCalledWith({ code: '123456' }));
    expect(await screen.findByText('AAAA-BBBB-CCCC-DDDD-EEEE')).toBeInTheDocument();
    expect(screen.getByText('FFFF-GGGG-HHHH-IIII-JJJJ')).toBeInTheDocument();
    expect(screen.getByTestId('mfa-status-badge')).toHaveTextContent('Enabled');
  });

  it('replaces recovery codes only after password and authenticator verification', async () => {
    const user = userEvent.setup();
    vi.mocked(auth.mfa.status).mockResolvedValue(response({ enabled: true, unusedRecoveryCodes: 4 }));
    vi.mocked(auth.mfa.regenerateRecoveryCodes).mockResolvedValue(response({ recoveryCodes: ['NEW1-NEW2-NEW3-NEW4-NEW5'] }));
    renderPanel();

    await user.click(await screen.findByTestId('mfa-regenerate-button'));
    await user.type(screen.getByLabelText('Current password'), 'correct-password');
    await user.type(screen.getByLabelText('Authenticator code'), '654321');
    await user.click(screen.getByRole('button', { name: 'Replace codes' }));

    await waitFor(() => expect(auth.mfa.regenerateRecoveryCodes).toHaveBeenCalledWith({
      password: 'correct-password',
      code: '654321',
    }));
    expect(await screen.findByText('NEW1-NEW2-NEW3-NEW4-NEW5')).toBeInTheDocument();
  });

  it('disables MFA with a password and recovery code', async () => {
    const user = userEvent.setup();
    vi.mocked(auth.mfa.status)
      .mockResolvedValueOnce(response({ enabled: true, unusedRecoveryCodes: 3 }))
      .mockResolvedValueOnce(response({ enabled: false, unusedRecoveryCodes: 0 }));
    vi.mocked(auth.mfa.disable).mockResolvedValue(response(undefined));
    renderPanel();

    await user.click(await screen.findByTestId('mfa-disable-button'));
    await user.type(screen.getByLabelText('Current password'), 'correct-password');
    await user.type(screen.getByLabelText('Authenticator or recovery code'), 'AAAA-BBBB-CCCC-DDDD-EEEE');
    await user.click(screen.getByRole('button', { name: 'Disable two-factor authentication' }));

    await waitFor(() => expect(auth.mfa.disable).toHaveBeenCalledWith({
      password: 'correct-password',
      code: 'AAAA-BBBB-CCCC-DDDD-EEEE',
    }));
    expect(await screen.findByTestId('mfa-enable-button')).toBeInTheDocument();
  });
});
