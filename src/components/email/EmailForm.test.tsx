import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { auth } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';
import { EmailForm } from './EmailForm';
import { Role } from '../../types/auth';

vi.mock('../../lib/api', () => ({
  auth: {
    getUsers: vi.fn(),
    me: vi.fn(),
  },
}));

const meWithRoles = (roles: string[]) => ({
  data: { id: 9, username: 'sender', email: 'sender@example.com', firstName: 'Send', lastName: 'Er', roles },
}) as any;

describe('EmailForm', () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

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
      {
        id: 2,
        username: 'anotheruser',
        email: 'another@example.com',
        firstName: 'Another',
        lastName: 'User',
        roles: [Role.CLIENT],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.getUsers).mockResolvedValue(mockUsers as any);
    vi.mocked(auth.me).mockResolvedValue(meWithRoles([Role.CLIENT]));
  });

  it('does not load the user directory for a client, who types the recipient', async () => {
    // when
    renderWithProviders(<EmailForm onSubmit={onSubmit} />);

    // then
    await waitFor(() => expect(auth.me).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(auth.getUsers).not.toHaveBeenCalled();
    expect(screen.queryByTestId('users-datalist')).not.toBeInTheDocument();
    expect(screen.getByLabelText('To')).not.toHaveAttribute('list');
  });

  it('sends a client email without a template or template properties', async () => {
    // Only GENERIC emails may come from clients; the form leaves the template to the backend default.
    renderWithProviders(<EmailForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('To'), 'friend@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Hello there');
    await user.type(screen.getByLabelText('Message'), 'A message long enough to send.');
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(Object.keys(onSubmit.mock.calls[0][0]).sort()).toEqual(['message', 'subject', 'to']);
  });

  // given
  it('offers every user as a recipient to an admin', async () => {
    vi.mocked(auth.me).mockResolvedValue(meWithRoles([Role.ADMIN]));
    // when
    renderWithProviders(<EmailForm onSubmit={onSubmit} />);

    // then
    expect(screen.getByLabelText('To')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Email' })).toBeInTheDocument();

    // verify user emails are loaded in datalist
    await waitFor(() => {
      const datalist = screen.getByTestId('users-datalist');
      expect(datalist).toBeInTheDocument();
      expect(datalist.children).toHaveLength(2);
      expect(datalist.children[0]).toHaveAttribute('value', 'test@example.com');
      expect(datalist.children[1]).toHaveAttribute('value', 'another@example.com');
    });
  });

  // given
  it('shows validation errors for empty fields', async () => {
    // when
    renderWithProviders(<EmailForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    // then
    expect(await screen.findByText('Recipient is required')).toBeInTheDocument();
    expect(await screen.findByText('Subject is required')).toBeInTheDocument();
    expect(await screen.findByText('Message is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // given
  it('links each validation error to its own field', async () => {
    // when
    renderWithProviders(<EmailForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    // then
    await screen.findByText('Message is required');
    expect(screen.getByLabelText('To')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('To')).toHaveAccessibleDescription('Recipient is required');
    expect(screen.getByLabelText('Subject')).toHaveAccessibleDescription('Subject is required');
    expect(screen.getByLabelText('Message')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Message')).toHaveAccessibleDescription('Message is required');
  });

  // given
  it('shows validation error for invalid email', async () => {
    // when
    renderWithProviders(<EmailForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('To'), 'invalid-email');
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    // then
    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // given
  it('shows validation errors for too short fields', async () => {
    // when
    renderWithProviders(<EmailForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('To'), 'test@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Hi');
    await user.type(screen.getByLabelText('Message'), 'Hi');
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    // then
    expect(await screen.findByText('Subject must be at least 3 characters')).toBeInTheDocument();
    expect(await screen.findByText('Message must be at least 10 characters')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // given
  it('submits form with valid data', async () => {
    // when
    renderWithProviders(<EmailForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('To'), 'test@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Test Subject');
    await user.type(screen.getByLabelText('Message'), 'This is a test message that is long enough.');
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    // then
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message that is long enough.',
      });
    });
  });

  // given
  it('disables submit button when loading', () => {
    // when
    renderWithProviders(<EmailForm onSubmit={onSubmit} isLoading />);

    // then
    const submitButton = screen.getByRole('button', { name: 'Sending...' });
    expect(submitButton).toBeDisabled();
  });
}); 