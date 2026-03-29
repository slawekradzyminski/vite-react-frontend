import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { auth } from '../../lib/api';
import { Role, type User } from '../../types/auth';
import { Surface } from '../../components/ui/surface';

export function EditUserPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
  });

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['user', username],
    queryFn: async () => {
      const response = await auth.getUsers();
      const user = response.data.find(u => u.username === username);
      if (!user) throw new Error('User not found');
      return user;
    },
    enabled: !!username,
  });

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (!username) throw new Error('No username provided');
      return auth.updateUser(username, {
        email: formData.get('email') as string,
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update user');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="edit-user-loading">Loading...</Surface>;
  }

  if (!user) {
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="edit-user-not-found">User not found</Surface>;
  }

  if (!currentUser?.data.roles.includes(Role.ADMIN)) {
    return <Surface variant="danger" padding="message" className="text-center text-red-600" data-testid="edit-user-denied">Access denied</Surface>;
  }

  return (
    <div className="space-y-6 pb-10" data-testid="edit-user-page">
      <Surface as="section" variant="hero" padding="xl" data-testid="edit-user-header">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="edit-user-title">Edit User</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600" data-testid="edit-user-username">Editing user: {username}</p>
      </Surface>

      <div className="mx-auto max-w-xl" data-testid="edit-user-container">
        <Surface as="form" variant="default" padding="lg" onSubmit={handleSubmit} className="space-y-6" data-testid="edit-user-form">
          <Surface variant="inset" padding="md" data-testid="edit-user-email-field">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
              className="mt-2"
              data-testid="edit-user-email-input"
            />
          </Surface>

          <Surface variant="inset" padding="md" data-testid="edit-user-firstname-field">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              defaultValue={user.firstName}
              required
              className="mt-2"
              data-testid="edit-user-firstname-input"
            />
          </Surface>

          <Surface variant="inset" padding="md" data-testid="edit-user-lastname-field">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              defaultValue={user.lastName}
              required
              className="mt-2"
              data-testid="edit-user-lastname-input"
            />
          </Surface>

          {error && (
            <Surface variant="danger" padding="sm" className="text-sm text-red-600" data-testid="edit-user-error">
              {error}
            </Surface>
          )}

          <div className="flex justify-end space-x-4" data-testid="edit-user-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/users')}
              data-testid="edit-user-cancel-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="edit-user-submit-button"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Surface>
      </div>
    </div>
  );
} 
