import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { HomePage } from './homePage';

// Create mock for navigation
const mockNavigate = vi.fn();

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => {
    if (queryKey[0] === 'me') {
      return {
        data: {
          data: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            roles: ['USER']
          }
        },
        isLoading: false,
        error: null
      };
    }
    return { data: null, isLoading: false, error: null };
  },
}));

vi.mock('../../lib/api', () => ({
  auth: {
    me: vi.fn(),
  },
}));

describe('HomePage', () => {
  // given
  let user;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    user = userEvent.setup();
  });

  it('renders the welcome section with user data', () => {
    // when
    render(<HomePage />);
    
    // then
    expect(screen.getByTestId('home-welcome-title')).toBeInTheDocument();
    expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('renders all feature sections', () => {
    // when
    render(<HomePage />);
    
    // then
    expect(screen.getByTestId('home-features-section')).toBeInTheDocument();
    expect(screen.getByTestId('home-monitoring-section')).toBeInTheDocument();
    expect(screen.getByTestId('home-ai-section')).toBeInTheDocument();
    expect(screen.getByTestId('home-utilities-section')).toBeInTheDocument();
  });

  it('renders all navigation buttons', () => {
    // when
    render(<HomePage />);
    
    // then
    expect(screen.getByTestId('home-products-button')).toBeInTheDocument();
    expect(screen.getByTestId('home-users-button')).toBeInTheDocument();
    expect(screen.getByTestId('home-profile-button')).toBeInTheDocument();
    expect(screen.getByTestId('home-traffic-button')).toBeInTheDocument();
    expect(screen.getByTestId('home-llm-button')).toBeInTheDocument();
    expect(screen.getByTestId('home-qr-button')).toBeInTheDocument();
    expect(screen.getByTestId('home-email-button')).toBeInTheDocument();
  });
  
  it('should render information about WebSockets and SSE', () => {
    // when
    render(<HomePage />);
    
    // then
    expect(screen.getByText(/WebSocket technology/i)).toBeInTheDocument();
    expect(screen.getByText(/Server-Sent Events \(SSE\)/i)).toBeInTheDocument();
  });
  
  it('should render specific information about utilities', () => {
    // when
    render(<HomePage />);
    
    // then
    expect(screen.getByText(/View orders and manage your personal account information/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate valid and scannable QR codes/i)).toBeInTheDocument();
    expect(screen.getByText(/Delivery is handled asynchronously with a delay of up to 10 minutes/i)).toBeInTheDocument();
  });
  
  it('should navigate to products page when View Products button is clicked', async () => {
    // given
    render(<HomePage />);
    
    // when
    await user.click(screen.getByTestId('home-products-button'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('should navigate to users page when Manage Users button is clicked', async () => {
    // given
    render(<HomePage />);
    
    // when
    await user.click(screen.getByTestId('home-users-button'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/users');
  });
  
  it('should navigate to profile page when View Profile & Orders button is clicked', async () => {
    // given
    render(<HomePage />);
    
    // when
    await user.click(screen.getByTestId('home-profile-button'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });
  
  it('should navigate to traffic monitor when Open Traffic Monitor button is clicked', async () => {
    // given
    render(<HomePage />);
    
    // when
    await user.click(screen.getByTestId('home-traffic-button'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/traffic');
  });
  
  it('should navigate to LLM page when Open AI Assistant button is clicked', async () => {
    // given
    render(<HomePage />);
    
    // when
    await user.click(screen.getByTestId('home-llm-button'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/llm');
  });
  
  it('should navigate to QR code page when Generate QR Codes button is clicked', async () => {
    // given
    render(<HomePage />);
    
    // when
    await user.click(screen.getByTestId('home-qr-button'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/qr');
  });
  
  it('should navigate to email page when Send Emails button is clicked', async () => {
    // given
    render(<HomePage />);
    
    // when
    await user.click(screen.getByTestId('home-email-button'));
    
    // then
    expect(mockNavigate).toHaveBeenCalledWith('/email');
  });
});