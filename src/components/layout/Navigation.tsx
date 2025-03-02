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
    { label: 'Orders', path: '/orders' },
    { label: 'Profile', path: '/profile' },
    { label: 'Send Email', path: '/email' },
    { label: 'QR Code', path: '/qr' },
    { label: 'LLM', path: '/llm' },
  ];

  const adminMenuItems = [
    { label: 'Admin', path: '/admin' },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-800">
                Awesome
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
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

          <div className="flex items-center">
            {user?.data ? (
              <>
                <Link to="/cart" className="mr-4 relative" data-testid="desktop-cart-icon">
                  <ShoppingCart className="h-6 w-6 text-gray-500 hover:text-gray-900" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                
                <div className="hidden sm:flex sm:items-center sm:ml-6 sm:space-x-4">
                  <span className="text-sm text-gray-500">
                    {user.data.firstName} {user.data.lastName}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    Logout
                  </Button>
                </div>
                <div className="sm:hidden flex items-center">
                  <button
                    onClick={toggleMenu}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  >
                    <span className="sr-only">Open main menu</span>
                    {isOpen ? (
                      <X className="block h-6 w-6" />
                    ) : (
                      <Menu className="block h-6 w-6" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {isOpen && user?.data && (
        <div className="sm:hidden" data-testid="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/cart"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 items-center"
              onClick={() => setIsOpen(false)}
              data-testid="mobile-menu-cart"
            >
              Cart
              {cartItemCount > 0 && (
                <span className="ml-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            
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
            
            <Button
              variant="ghost"
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
} 