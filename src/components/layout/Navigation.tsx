import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { auth } from '../../lib/api';
import { Button } from '../ui/button';

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    queryClient.invalidateQueries({ queryKey: ['me'] });
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Cart', path: '/cart' },
    { label: 'Send Email', path: '/email' },
    { label: 'QR Code', path: '/qr' },
    { label: 'Profile', path: '/profile' },
    { label: 'Ollama Generate', path: '/ollama-generate' },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-800">
                E-Commerce
              </Link>
            </div>
            {/* Desktop menu */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {user?.data && menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User actions */}
          <div className="flex items-center">
            {user?.data ? (
              <>
                {/* Desktop user info */}
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
                {/* Mobile menu button - only show when logged in */}
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
              <Link
                to="/login"
                className="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu - only show when logged in */}
      {isOpen && user?.data && (
        <div className="sm:hidden" data-testid="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
                data-testid={`mobile-menu-${item.label.toLowerCase()}`}
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