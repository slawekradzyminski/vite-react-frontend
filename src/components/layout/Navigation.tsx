import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { auth, cart } from '../../lib/api';
import { Button } from '../ui/button';
import { Role } from '../../types/auth';

export function Navigation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
    retry: false,
    enabled: !!localStorage.getItem('token'),
  });

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: cart.getCart,
    retry: false,
    enabled: !!localStorage.getItem('token'),
  });

  const cartItemCount = cartData?.data?.totalItems || 0;

  const handleLogout = () => {
    localStorage.removeItem('token');
    queryClient.invalidateQueries({ queryKey: ['me'] });
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isAdmin = user?.data?.roles?.includes(Role.ADMIN);

  const authMenuItems = [
    { label: 'Home', path: '/' },
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
    <nav className="bg-white shadow-lg" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="hidden lg:ml-6 lg:flex lg:space-x-8" data-testid="desktop-menu">
              {user?.data && authMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                  data-testid={`desktop-menu-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.label}
                </Link>
              ))}
              
              {isAdmin && adminMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                  data-testid={`desktop-menu-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center" data-testid="navigation-actions">
            {user?.data ? (
              <>
                <Link to="/cart" className="mr-4 relative" data-testid="desktop-cart-icon">
                  <ShoppingCart className="h-6 w-6 text-gray-500 hover:text-gray-900" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" data-testid="cart-item-count">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                
                <div className="hidden lg:flex lg:items-center lg:ml-6 lg:space-x-4" data-testid="user-actions">
                  <Link 
                    to="/profile" 
                    className="text-sm text-gray-500 hover:text-gray-900 hover:underline"
                    data-testid="username-profile-link"
                  >
                    {user.data.firstName} {user.data.lastName}
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900"
                    data-testid="logout-button"
                  >
                    Logout
                  </Button>
                </div>
                <div className="lg:hidden flex items-center">
                  <button
                    onClick={toggleMenu}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    data-testid="mobile-menu-toggle"
                  >
                    <span className="sr-only">Open main menu</span>
                    {isOpen ? (
                      <X className="block h-6 w-6" data-testid="mobile-menu-close-icon" />
                    ) : (
                      <Menu className="block h-6 w-6" data-testid="mobile-menu-open-icon" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4" data-testid="auth-actions">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                  data-testid="login-link"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
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
        <div className="lg:hidden" data-testid="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {authMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
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
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
                data-testid={`mobile-menu-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                {item.label}
              </Link>
            ))}
            
            <Link
              to="/cart"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 items-center"
              onClick={() => setIsOpen(false)}
              data-testid="mobile-menu-cart"
            >
              Cart
              {cartItemCount > 0 && (
                <span className="ml-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" data-testid="mobile-cart-item-count">
                  {cartItemCount}
                </span>
              )}
            </Link>
            
            <Link
              to="/profile"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
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
              className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              data-testid="mobile-menu-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
} 