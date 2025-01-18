import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { auth } from '../lib/api';
import { Role, type User } from '../types/auth';

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
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="text-center p-8">User not found</div>;
  }

  if (!currentUser?.data.roles.includes(Role.ADMIN)) {
    return <div className="text-center p-8">Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="mt-2 text-gray-600">Editing user: {username}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              defaultValue={user.firstName}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              defaultValue={user.lastName}
              required
              className="mt-1"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/users')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 