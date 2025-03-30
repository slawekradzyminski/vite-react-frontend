import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { auth } from '../../lib/api';
import type { User } from '../../types/auth';
import { Role } from '../../types/auth';

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

  const isAdmin = !isLoading && !!(currentUser?.data.roles && currentUser.data.roles.includes(Role.ADMIN));

  return (
    <div className="min-h-screen bg-gray-50 p-8" data-testid="users-page">
      <div className="mx-auto max-w-4xl" data-testid="users-container">
        <div className="flex justify-between items-center mb-8" data-testid="users-header">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="users-title">Users</h1>
          <Button variant="outline" onClick={() => navigate('/')} data-testid="users-back-button">Back to Home</Button>
        </div>

        {isLoading && (
          <div className="text-center" data-testid="users-loading">Loading users...</div>
        )}

        {error && (
          <div className="text-red-600" data-testid="users-error">Failed to load users</div>
        )}

        {users && (
          <div className="bg-white shadow-sm rounded-lg divide-y" data-testid="users-list">
            {users && users.map((user) => (
              <div key={user.id} className="p-6" data-testid={`user-item-${user.id}`}>
                <div className="flex justify-between items-start">
                  <div data-testid={`user-info-${user.id}`}>
                    <h3 className="text-lg font-medium text-gray-900" data-testid={`user-name-${user.id}`}>
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500" data-testid={`user-email-${user.id}`}>{user.email}</p>
                    <p className="mt-1 text-sm text-gray-500" data-testid={`user-username-${user.id}`}>
                      Username: {user.username}
                    </p>
                    <div className="mt-1 text-sm text-gray-500" data-testid={`user-roles-${user.id}`}>
                      Roles: {user.roles.join(', ')}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="space-x-2" data-testid={`user-actions-${user.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/users/${user.username}/edit`)}
                        data-testid={`user-edit-${user.id}`}
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
                        data-testid={`user-delete-${user.id}`}
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