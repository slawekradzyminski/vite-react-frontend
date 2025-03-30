import { describe, it, expect, vi, beforeEach, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePage } from './homePage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API module
vi.mock('../../lib/api', () => ({
  auth: {
    me: vi.fn().mockResolvedValue({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        roles: ['USER']
      }
    })
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('HomePage', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    user = userEvent.setup();
    mockNavigate.mockClear();
  });

  // given
  it('should render the welcome message with user name', async () => {
    // when
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );
    
    // then
    await waitFor(() => {
      expect(screen.getByText(/welcome, john!/i)).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });
  });

  // given
  it('should render all feature sections', async () => {
    // when
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );
    
    // then
    await waitFor(() => {
      // Main sections
      expect(screen.getByText('Application Features')).toBeInTheDocument();
      expect(screen.getByText('Advanced Monitoring')).toBeInTheDocument();
      expect(screen.getByText('AI Integration')).toBeInTheDocument();
      expect(screen.getByText('Additional Utilities')).toBeInTheDocument();
      
      // Feature details
      expect(screen.getByText('Product Management')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Order Processing & Profile')).toBeInTheDocument();
      expect(screen.getByText('Traffic Monitor')).toBeInTheDocument();
      expect(screen.getByText('LLM Assistant')).toBeInTheDocument();
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
      expect(screen.getByText('Email Service')).toBeInTheDocument();
    });
  });

  // given
  it('should render information about WebSockets and SSE', async () => {
    // when
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );
    
    // then
    await waitFor(() => {
      expect(screen.getByText(/WebSocket technology/i)).toBeInTheDocument();
      expect(screen.getByText(/Server-Sent Events \(SSE\)/i)).toBeInTheDocument();
    });
  });

  // given
  test('should render specific information about utilities', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );
    
    // then
    await waitFor(() => {
      expect(screen.getByText(/View orders and manage your personal account information/i)).toBeInTheDocument();
      expect(screen.getByText(/Generate valid and scannable QR codes/i)).toBeInTheDocument();
      expect(screen.getByText(/Delivery is handled asynchronously with a delay of up to 10 minutes/i)).toBeInTheDocument();
    });
  });

  // given
  it('should navigate to products page when View Products is clicked', async () => {
    // when
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );
    
    await waitFor(() => screen.getByText('View Products'));
    await user.click(screen.getByText('View Products'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  // given
  it('should navigate to profile page when View Profile & Orders is clicked', async () => {
    // when
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );
    
    await waitFor(() => screen.getByText('View Profile & Orders'));
    await user.click(screen.getByText('View Profile & Orders'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  // given
  it('should navigate to traffic monitor when Open Traffic Monitor is clicked', async () => {
    // when
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );
    
    await waitFor(() => screen.getByText('Open Traffic Monitor'));
    await user.click(screen.getByText('Open Traffic Monitor'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/traffic');
  });

  // given
  it('should navigate to LLM page when Open AI Assistant is clicked', async () => {
    // when
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );
    
    await waitFor(() => screen.getByText('Open AI Assistant'));
    await user.click(screen.getByText('Open AI Assistant'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/llm');
  });
});