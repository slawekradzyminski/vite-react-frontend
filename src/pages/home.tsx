import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { auth } from '../lib/api';

export function HomePage() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.data.firstName}!
            </h1>
            <p className="mt-1 text-gray-500">{user?.data.email}</p>
          </div>
          <div className="space-x-4">
            <Button onClick={() => navigate('/users')}>View Users</Button>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-lg text-gray-700">
            You are now logged in to the application. Use the navigation above to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
            <li>View the list of users</li>
            <li>Manage your account</li>
            <li>Access other features</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 