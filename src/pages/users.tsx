import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { auth } from '../lib/api';
import type { User } from '../types/auth';

export function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
  });

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await auth.getUsers();
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (username: string) => auth.deleteUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const isAdmin = currentUser?.data.roles.includes('ROLE_ADMIN');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
        </div>

        {isLoading && (
          <div className="text-center">Loading users...</div>
        )}

        {error && (
          <div className="text-red-600">Failed to load users</div>
        )}

        {users && (
          <div className="bg-white shadow-sm rounded-lg divide-y">
            {users.map((user) => (
              <div key={user.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Username: {user.username}
                    </p>
                    <div className="mt-1 text-sm text-gray-500">
                      Roles: {user.roles.join(', ')}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/users/${user.username}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this user?')) {
                            deleteMutation.mutate(user.username);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 