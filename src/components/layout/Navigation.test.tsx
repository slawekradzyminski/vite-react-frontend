import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { auth } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';
import { Navigation } from './Navigation';
import { Role } from '../../types/auth';

vi.mock('../../lib/api', () => ({
  auth: {
    me: vi.fn(),
  },
}));

describe('Navigation', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // given
  it('shows login link when user is not authenticated', () => {
    // when
    renderWithProviders(<Navigation />);

    // then
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  // given
  it('shows user info and logout button when authenticated', async () => {
    // when
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [Role.CLIENT],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<Navigation />);

    // then
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });
  });

  // given
  it('shows LLM link when authenticated', async () => {
    // when
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [Role.CLIENT],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<Navigation />);

    // then
    await waitFor(() => {
      expect(screen.getByText('LLM')).toBeInTheDocument();
    });
  });

  // given
  it('shows QR Code link when authenticated', async () => {
    // when
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [Role.CLIENT],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<Navigation />);

    // then
    await waitFor(() => {
      expect(screen.getByText('QR Code')).toBeInTheDocument();
    });
  });

  // given
  it('handles logout correctly', async () => {
    // when
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [Role.CLIENT],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<Navigation />);
    
    const logoutButton = await screen.findByText('Logout');
    await user.click(logoutButton);

    // then
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.pathname).toBe('/login');
  });

  // given
  it('toggles mobile menu correctly', async () => {
    // when
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [Role.CLIENT],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<Navigation />);
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    await user.click(menuButton);

    // then
    const mobileMenu = screen.getByTestId('mobile-menu');
    expect(mobileMenu).toBeVisible();
    expect(mobileMenu).toHaveTextContent('Home');
    expect(mobileMenu).toHaveTextContent('Products');
    expect(mobileMenu).toHaveTextContent('Cart');
    expect(mobileMenu).toHaveTextContent('Send Email');
    expect(mobileMenu).toHaveTextContent('Profile');
    expect(mobileMenu).toHaveTextContent('LLM');

    // when
    await user.click(menuButton);

    // then
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });

  // given
  it('closes mobile menu when a link is clicked', async () => {
    // when
    localStorage.setItem('token', 'fake-token');
    vi.mocked(auth.me).mockResolvedValue({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [Role.CLIENT],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    renderWithProviders(<Navigation />);
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    await user.click(menuButton);
    
    const mobileHomeLink = screen.getByTestId('mobile-menu-home');
    await user.click(mobileHomeLink);

    // then
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });
}); 