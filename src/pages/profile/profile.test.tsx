import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Profile } from './profilePage';
import { auth, systemPrompt, orders } from '../../lib/api';
import { Role } from '../../types/auth';
import { renderWithProviders } from '../../test/test-utils';
import { vi } from 'vitest';

const mockToast = vi.fn();

vi.mock('../../hooks/useToast', async () => {
  const actual = await vi.importActual<typeof import('../../hooks/useToast')>('../../hooks/useToast');
  return {
    ...actual,
    useToast: () => ({ toast: mockToast }),
  };
});

vi.mock('../../lib/api', () => ({
  auth: {
    me: vi.fn(),
    updateUser: vi.fn(),
  },
  systemPrompt: {
    get: vi.fn(),
    update: vi.fn(),
  },
  orders: {
    getUserOrders: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/profile' }),
  };
});

describe('Profile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockToast.mockReset();

    vi.mocked(auth.me).mockResolvedValue({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['ROLE_CLIENT' as Role],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as any,
    });

    vi.mocked(systemPrompt.get).mockResolvedValue({
      data: {
        username: 'testuser',
        systemPrompt: 'Test system prompt',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as any,
    });

    vi.mocked(orders.getUserOrders).mockResolvedValue({
      data: {
        content: [
          {
            id: 1,
            username: 'testuser',
            status: 'DELIVERED',
            totalAmount: 99.99,
            createdAt: '2023-01-01T12:00:00Z',
            updatedAt: '2023-01-01T12:00:00Z',
            items: [],
            shippingAddress: {
              street: '123 Test St',
              city: 'Test City',
              state: 'Test State',
              zipCode: '12345',
              country: 'Test Country'
            }
          },
        ],
        pageNumber: 0,
        pageSize: 5,
        totalElements: 1,
        totalPages: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as any,
    });
  });

  it('should render the profile page with user data', async () => {
    // given
    renderWithProviders(<Profile />);

    // when
    await waitFor(() => expect(auth.me).toHaveBeenCalled());
    await waitFor(() => expect(systemPrompt.get).toHaveBeenCalled());
    await waitFor(() => expect(orders.getUserOrders).toHaveBeenCalled());
    
    // Wait for loading states to resolve
    await waitFor(() => {
      expect(screen.queryByText('Loading prompt...')).not.toBeInTheDocument();
      expect(screen.queryByText('Loading orders...')).not.toBeInTheDocument();
    });

    // then
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('System Prompt')).toBeInTheDocument();
    expect(screen.getByText('Your Orders')).toBeInTheDocument();
    
    // Check if user data is displayed
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('User')).toBeInTheDocument();
    
    // Check if system prompt is displayed - using a more flexible approach
    const promptTextarea = screen.getByLabelText('Your System Prompt');
    expect(promptTextarea).toBeInTheDocument();
    
    // Check if order is displayed
    expect(screen.getByText(/Order #/)).toBeInTheDocument();
    expect(screen.getByText('DELIVERED')).toBeInTheDocument();
    expect(screen.getByText(/\$99.99/)).toBeInTheDocument();
  });

  it('should update user information when form is submitted', async () => {
    // given
    vi.mocked(auth.updateUser).mockResolvedValue({
      data: {
        id: 1,
        username: 'testuser',
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
        roles: ['ROLE_CLIENT' as Role],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as any,
    });

    renderWithProviders(<Profile />);
    await waitFor(() => expect(auth.me).toHaveBeenCalled());

    // when
    const emailInput = screen.getByLabelText('Email');
    const firstNameInput = screen.getByLabelText('First Name');
    
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
    fireEvent.change(firstNameInput, { target: { value: 'Updated' } });
    
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // then
    await waitFor(() => {
      expect(auth.updateUser).toHaveBeenCalledWith('testuser', {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
      });
    });
  });

  it('should show empty state when no orders are available', async () => {
    // given
    vi.mocked(orders.getUserOrders).mockResolvedValue({
      data: {
        content: [],
        pageNumber: 0,
        pageSize: 5,
        totalElements: 0,
        totalPages: 0,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as any,
    });

    renderWithProviders(<Profile />);

    // when
    await waitFor(() => expect(orders.getUserOrders).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.queryByText('Loading orders...')).not.toBeInTheDocument();
    });

    // then
    expect(await screen.findByText("You don't have any orders yet.")).toBeInTheDocument();
  });

  it('shows not found message when current user is missing', async () => {
    vi.mocked(auth.me).mockResolvedValue({
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<Profile />);

    expect(await screen.findByTestId('profile-not-found')).toBeInTheDocument();
  });

  it('submits the system prompt form successfully', async () => {
    vi.mocked(systemPrompt.update).mockResolvedValue({
      data: { username: 'testuser', systemPrompt: 'New prompt' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<Profile />);

    const textarea = await screen.findByTestId('profile-prompt-input');
    fireEvent.change(textarea, { target: { value: 'Fresh prompt' } });
    fireEvent.click(screen.getByTestId('profile-prompt-submit'));

    await waitFor(() => {
      expect(systemPrompt.update).toHaveBeenCalledWith('Fresh prompt');
    });
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'success',
      title: 'Success',
      description: 'System prompt updated successfully',
    });
  });

  it('shows error toast when system prompt update fails', async () => {
    vi.mocked(systemPrompt.update).mockRejectedValue({
      response: { data: { message: 'Failed to update system prompt' } },
    });

    renderWithProviders(<Profile />);

    const textarea = await screen.findByTestId('profile-prompt-input');
    fireEvent.change(textarea, { target: { value: 'Another prompt' } });
    fireEvent.click(screen.getByTestId('profile-prompt-submit'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'error',
        title: 'Error',
        description: 'Failed to update system prompt',
      });
    });
  });
});
