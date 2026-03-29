import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { auth, cart } from '../../lib/api';
import { Button } from '../ui/button';
import { Role } from '../../types/auth';
import { authStorage } from '../../lib/authStorage';

const PRODUCT_NAME = 'Awesome Testing';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  const hasToken = !!authStorage.getAccessToken();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
    retry: false,
    enabled: hasToken,
  });

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: cart.getCart,
    retry: false,
    enabled: hasToken,
  });

  const cartItemCount = cartData?.data?.totalItems || 0;

  const handleLogout = useCallback(async () => {
    const { refreshToken } = authStorage.getTokens();
    try {
      if (refreshToken) {
        await auth.logout({ refreshToken });
      }
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      authStorage.clearTokens();
      queryClient.removeQueries({ queryKey: ['me'], exact: true });
      queryClient.removeQueries({ queryKey: ['cart'], exact: true });
      navigate('/login');
    }
  }, [navigate, queryClient]);

  useEffect(() => {
    if (hasToken && isAuthPage) {
      handleLogout();
    }
  }, [handleLogout, hasToken, isAuthPage]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isAdmin = user?.data?.roles?.includes(Role.ADMIN);
  const isActive = (path: string) =>
    path === '/' ? location.pathname === path : location.pathname.startsWith(path);

  const authMenuItems = [
    { label: 'Products', path: '/products' },
    { label: 'Send Email', path: '/email' },
    { label: 'QR Code', path: '/qr' },
    { label: 'LLM', path: '/llm' },
    { label: 'Traffic Monitor', path: '/traffic' },
  ];

  const adminMenuItems = [
    { label: 'Admin', path: '/admin' },
  ];

  return (
    <nav
      className="sticky top-0 z-40 border-b border-stone-200/80 bg-stone-50/88 backdrop-blur-xl"
      data-testid="navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-18 items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              to={user?.data ? '/' : '/login'}
              className="group flex shrink-0 items-center justify-center rounded-2xl p-1 transition hover:bg-white/70"
              data-testid="brand-link"
            >
              <img
                src="/images/logo/generated/at-transparent.png"
                alt={PRODUCT_NAME}
                className="block h-11 w-11 object-contain sm:h-12 sm:w-12"
              />
            </Link>

            <div className="hidden lg:flex lg:items-center lg:gap-2" data-testid="desktop-menu">
              {user?.data && authMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive(item.path)
                      ? 'bg-slate-900 text-stone-50 shadow-[0_10px_25px_-16px_rgba(15,23,42,0.75)]'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                  data-testid={`desktop-menu-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.label}
                </Link>
              ))}

              {isAdmin && adminMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive(item.path)
                      ? 'bg-slate-900 text-stone-50 shadow-[0_10px_25px_-16px_rgba(15,23,42,0.75)]'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                  data-testid={`desktop-menu-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2" data-testid="navigation-actions">
            {user?.data ? (
              <>
                <Link
                  to="/cart"
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-600 shadow-[0_10px_25px_-20px_rgba(15,23,42,0.75)] transition hover:-translate-y-0.5 hover:border-stone-300 hover:text-slate-900"
                  data-testid="desktop-cart-icon"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white"
                      data-testid="cart-item-count"
                    >
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                <div className="hidden lg:flex lg:items-center lg:gap-3" data-testid="user-actions">
                  <Link
                    to="/profile" 
                    className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-stone-200 hover:bg-white hover:text-slate-900"
                    data-testid="username-profile-link"
                  >
                    {user.data.firstName} {user.data.lastName}
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="rounded-full px-4 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900"
                    data-testid="logout-button"
                  >
                    Logout
                  </Button>
                </div>
                <div className="flex items-center lg:hidden">
                  <button
                    onClick={toggleMenu}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-600 transition hover:border-stone-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600"
                    data-testid="mobile-menu-toggle"
                  >
                    <span className="sr-only">Open main menu</span>
                    {isOpen ? (
                      <X className="block h-5 w-5" data-testid="mobile-menu-close-icon" />
                    ) : (
                      <Menu className="block h-5 w-5" data-testid="mobile-menu-open-icon" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2" data-testid="auth-actions">
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
                  data-testid="login-link"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
                  data-testid="register-link"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {isOpen && user?.data && (
        <div className="border-t border-stone-200/80 bg-stone-50/95 px-4 pb-4 pt-3 lg:hidden" data-testid="mobile-menu">
          <div className="space-y-2">
            {authMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block rounded-2xl px-4 py-3 text-base font-medium transition ${
                  isActive(item.path)
                    ? 'bg-slate-900 text-stone-50'
                    : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
                onClick={() => setIsOpen(false)}
                data-testid={`mobile-menu-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                {item.label}
              </Link>
            ))}

            {isAdmin && adminMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block rounded-2xl px-4 py-3 text-base font-medium transition ${
                  isActive(item.path)
                    ? 'bg-slate-900 text-stone-50'
                    : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
                onClick={() => setIsOpen(false)}
                data-testid={`mobile-menu-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                {item.label}
              </Link>
            ))}

            <div className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-2 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.8)]">
              <Link
                to="/cart"
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-medium text-slate-700 transition hover:bg-stone-50 hover:text-slate-900"
                onClick={() => setIsOpen(false)}
                data-testid="mobile-menu-cart"
              >
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <span
                    className="ml-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-sky-600 px-2 text-xs font-bold text-white"
                    data-testid="mobile-cart-item-count"
                  >
                    {cartItemCount}
                  </span>
                )}
              </Link>

              <Link
                to="/profile"
                className="block rounded-2xl px-4 py-3 text-base font-medium text-slate-700 transition hover:bg-stone-50 hover:text-slate-900"
                onClick={() => setIsOpen(false)}
                data-testid="mobile-menu-username"
              >
                {user.data.firstName} {user.data.lastName}
              </Link>

              <Button
                variant="ghost"
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="block h-auto w-full justify-start rounded-2xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-stone-50 hover:text-slate-900"
                data-testid="mobile-menu-logout"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 
