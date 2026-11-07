import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { auth, email } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';
import { EmailPage } from './emailPage';
import { Role } from '../../types/auth';

vi.mock('../../lib/api', () => ({
  auth: {
    getUsers: vi.fn(),
  },
  email: {
    send: vi.fn(),
  },
}));

describe('EmailPage', () => {
  const user = userEvent.setup();

  const mockUsers = {
    data: [
      {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [Role.CLIENT],
      },
    ],
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.getUsers).mockResolvedValue(mockUsers);
  });

  // given
  it('renders email form', () => {
    // when
    renderWithProviders(<EmailPage />);

    // then
    expect(screen.getByRole('heading', { name: 'Send Email' })).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Email' })).toBeInTheDocument();
  });

  // given
  it('shows success toast when email is sent', async () => {
    // when
    vi.mocked(email.send).mockResolvedValue({
      data: {
        success: true,
        message: 'Email sent',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<EmailPage />);

    await user.type(screen.getByLabelText('To'), 'test@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Test Subject');
    await user.type(screen.getByLabelText('Message'), 'This is a test message that is long enough.');
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    // then
    await waitFor(() => {
      expect(screen.getByText('Email queued for delivery')).toBeInTheDocument();
    });

    expect(email.send).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a test message that is long enough.',
    });
  });

  // given
  it('shows error toast when email fails to send', async () => {
    // when
    vi.mocked(email.send).mockRejectedValue({
      response: {
        data: {
          message: 'Recipient not found',
        },
      },
    });

    renderWithProviders(<EmailPage />);

    await user.type(screen.getByLabelText('To'), 'test@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Test Subject');
    await user.type(screen.getByLabelText('Message'), 'This is a test message that is long enough.');
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    // then
    await waitFor(() => {
      expect(screen.getByText('Recipient not found')).toBeInTheDocument();
    });
  });

  // given
  it('shows generic error when server error occurs', async () => {
    // when
    vi.mocked(email.send).mockRejectedValue({
      response: {},
    });

    renderWithProviders(<EmailPage />);

    await user.type(screen.getByLabelText('To'), 'test@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Test Subject');
    await user.type(screen.getByLabelText('Message'), 'This is a test message that is long enough.');
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    // then
    await waitFor(() => {
      expect(screen.getByText('Failed to send email')).toBeInTheDocument();
    });
  });

  it('sends one request and shows progress while the first submission is pending (BUG-012)', async () => {
    // given
    let resolveSend: (value: unknown) => void = () => {};
    vi.mocked(email.send).mockReturnValue(new Promise((resolve) => { resolveSend = resolve; }) as never);
    renderWithProviders(<EmailPage />);
    await user.type(screen.getByLabelText('To'), 'test@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Test Subject');
    await user.type(screen.getByLabelText('Message'), 'Duplicate submission check');
    const button = screen.getByRole('button', { name: 'Send Email' });

    // when
    await user.dblClick(button);

    // then
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled());
    expect(email.send).toHaveBeenCalledTimes(1);
    resolveSend({ data: { success: true } });
    expect(await screen.findByRole('button', { name: 'Send Email' })).toBeEnabled();
  });

  it('shows field errors for whitespace-only input without calling the API', async () => {
    // given
    renderWithProviders(<EmailPage />);
    await user.type(screen.getByLabelText('To'), '   ');
    await user.type(screen.getByLabelText('Subject'), '   ');
    await user.type(screen.getByLabelText('Message'), '          ');

    // when
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    // then
    expect(await screen.findByText('Recipient is required')).toBeInTheDocument();
    expect(screen.getByText('Subject is required')).toBeInTheDocument();
    expect(screen.getByText('Message is required')).toBeInTheDocument();
    expect(email.send).not.toHaveBeenCalled();
  });

  it('accepts a new submission once the previous one has finished', async () => {
    // given
    vi.mocked(email.send).mockRejectedValueOnce({ response: { data: { message: 'Mail server down' } } });
    vi.mocked(email.send).mockResolvedValueOnce({ data: { success: true } } as never);
    renderWithProviders(<EmailPage />);
    await user.type(screen.getByLabelText('To'), 'test@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Test Subject');
    await user.type(screen.getByLabelText('Message'), 'Retry after a failure');
    await user.click(screen.getByRole('button', { name: 'Send Email' }));
    expect(await screen.findByText('Mail server down')).toBeInTheDocument();

    // when
    await user.click(await screen.findByRole('button', { name: 'Send Email' }));

    // then
    expect(await screen.findByText('Email queued for delivery')).toBeInTheDocument();
    expect(email.send).toHaveBeenCalledTimes(2);
  });
});
