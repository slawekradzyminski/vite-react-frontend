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
  cart: {
    getCart: vi.fn().mockResolvedValue({
      data: {
        items: [],
        totalItems: 0,
        totalPrice: 0
      }
    }),
  },
}));

describe('Navigation', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows login link when user is not authenticated', () => {
    // when
    renderWithProviders(<Navigation />);

    // then
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('shows user info and logout button when authenticated', async () => {
    // given
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

    // when
    renderWithProviders(<Navigation />);

    // then
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });
  });

  it('navigates to profile page when username is clicked', async () => {
    // given
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

    // when
    const usernameLink = await screen.findByText('Test User');
    await user.click(usernameLink);

    // then
    expect(window.location.pathname).toBe('/profile');
  });

  it('shows LLM link when authenticated', async () => {
    // given
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

    // when
    renderWithProviders(<Navigation />);

    // then
    await waitFor(() => {
      expect(screen.getByText('LLM')).toBeInTheDocument();
    });
  });

  it('shows QR Code link when authenticated', async () => {
    // given
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

    // when
    renderWithProviders(<Navigation />);

    // then
    await waitFor(() => {
      expect(screen.getByText('QR Code')).toBeInTheDocument();
    });
  });

  it('handles logout correctly', async () => {
    // given
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
    
    // when
    const logoutButton = await screen.findByText('Logout');
    await user.click(logoutButton);

    // then
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.pathname).toBe('/login');
  });

  it('toggles mobile menu correctly', async () => {
    // given
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
    
    // when
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    await user.click(menuButton);

    // then
    const mobileMenu = screen.getByTestId('mobile-menu');
    expect(mobileMenu).toBeVisible();
    expect(mobileMenu).toHaveTextContent('Home');
    expect(mobileMenu).toHaveTextContent('Products');
    expect(mobileMenu).toHaveTextContent('Cart');
    expect(mobileMenu).toHaveTextContent('Send Email');
    expect(mobileMenu).toHaveTextContent('LLM');
    expect(mobileMenu).toHaveTextContent('Test User');

    // when
    await user.click(menuButton);

    // then
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });

  it('closes mobile menu when a link is clicked', async () => {
    // given
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

  it('navigates to profile page when username is clicked in mobile menu', async () => {
    // given
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

    // when
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    await user.click(menuButton);
    
    const mobileUsernameLink = screen.getByTestId('mobile-menu-username');
    await user.click(mobileUsernameLink);

    // then
    expect(window.location.pathname).toBe('/profile');
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });
}); 