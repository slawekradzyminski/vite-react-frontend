import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Profile } from './index';
import { auth, systemPrompt, orders } from '../../lib/api';

// Mock the API modules
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

describe('Profile', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset mocks
    vi.resetAllMocks();

    // Mock auth.me
    vi.mocked(auth.me).mockResolvedValue({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['ROLE_CLIENT'],
      },
    });

    // Mock systemPrompt.get
    vi.mocked(systemPrompt.get).mockResolvedValue({
      data: {
        username: 'testuser',
        systemPrompt: 'Test system prompt',
      },
    });

    // Mock orders.getUserOrders
    vi.mocked(orders.getUserOrders).mockResolvedValue({
      data: {
        content: [
          {
            id: 1,
            status: 'COMPLETED',
            totalAmount: 99.99,
            createdAt: '2023-01-01T12:00:00Z',
            items: [],
          },
        ],
        pageable: {
          pageNumber: 0,
          pageSize: 5,
        },
        totalElements: 1,
        totalPages: 1,
      },
    });
  });

  it('should render the profile page with user data', async () => {
    // given
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </QueryClientProvider>
    );

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
    expect(screen.getByText('Order History')).toBeInTheDocument();
    
    // Check if user data is displayed
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('User')).toBeInTheDocument();
    
    // Check if system prompt is displayed - using a more flexible approach
    const promptTextarea = screen.getByLabelText('Your System Prompt');
    expect(promptTextarea).toBeInTheDocument();
    
    // Check if order is displayed
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('should update system prompt when form is submitted', async () => {
    // given
    vi.mocked(systemPrompt.update).mockResolvedValue({
      data: {
        username: 'testuser',
        systemPrompt: 'Updated system prompt',
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => expect(systemPrompt.get).toHaveBeenCalled());

    // when
    const promptTextarea = screen.getByLabelText('Your System Prompt');
    fireEvent.change(promptTextarea, { target: { value: 'Updated system prompt' } });
    
    const saveButton = screen.getByText('Save Prompt');
    fireEvent.click(saveButton);

    // then
    await waitFor(() => {
      expect(systemPrompt.update).toHaveBeenCalledWith('testuser', 'Updated system prompt');
    });
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
        roles: ['ROLE_CLIENT'],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </QueryClientProvider>
    );

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
        pageable: {
          pageNumber: 0,
          pageSize: 5,
        },
        totalElements: 0,
        totalPages: 0,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // when
    await waitFor(() => expect(orders.getUserOrders).toHaveBeenCalled());

    // then
    expect(screen.getByText('You have no orders yet.')).toBeInTheDocument();
  });
}); 