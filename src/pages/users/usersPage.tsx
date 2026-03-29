import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { auth } from '../../lib/api';
import type { User } from '../../types/auth';
import { Role } from '../../types/auth';
import { Surface } from '../../components/ui/surface';

export function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? 'Failed to delete user';
      setDeleteError(message);
    },
  });

  const isAdmin = !isLoading && !!(currentUser?.data.roles && currentUser.data.roles.includes(Role.ADMIN));

  return (
    <div className="space-y-6 pb-10" data-testid="users-page">
      <Surface as="section" variant="hero" padding="xl" data-testid="users-container">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between" data-testid="users-header">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="users-title">Users</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/')} data-testid="users-back-button">Back to Home</Button>
        </div>
      </Surface>

      {isLoading && (
        <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="users-loading">Loading users...</Surface>
      )}

      {error && (
        <Surface variant="danger" padding="message" className="text-red-600" data-testid="users-error">Failed to load users</Surface>
      )}

      {deleteError && (
        <Surface variant="danger" padding="sm" className="text-red-600" data-testid="users-delete-error">
          {deleteError}
        </Surface>
      )}

      {users && (
        <div className="space-y-4" data-testid="users-list">
          {users.map((user) => (
            <Surface key={user.id} variant="default" padding="lg" data-testid={`user-item-${user.id}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div data-testid={`user-info-${user.id}`}>
                  <h3 className="text-lg font-medium text-slate-900" data-testid={`user-name-${user.id}`}>
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500" data-testid={`user-email-${user.id}`}>{user.email}</p>
                  <p className="mt-1 text-sm text-slate-500" data-testid={`user-username-${user.id}`}>
                    Username: {user.username}
                  </p>
                  <div className="mt-1 text-sm text-slate-500" data-testid={`user-roles-${user.id}`}>
                    Roles: {user.roles.join(', ')}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap gap-2" data-testid={`user-actions-${user.id}`}>
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
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
} 
