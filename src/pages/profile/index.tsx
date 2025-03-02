import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth, systemPrompt } from '../../lib/api';
import { UserEditForm } from '../../components/user/UserEditForm';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/useToast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { systemPromptSchema, SystemPromptFormData } from '../../validators/user';
import type { UserEditDTO } from '../../types/auth';
import { OrderList } from '../../components/orders/OrderList';

export function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
  });

  const username = currentUser?.data?.username;

  // Setup form for system prompt
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SystemPromptFormData>({
    resolver: zodResolver(systemPromptSchema),
    defaultValues: {
      systemPrompt: '',
    },
  });

  // Fetch system prompt
  const { isLoading: isLoadingPrompt } = useQuery({
    queryKey: ['systemPrompt', username],
    queryFn: async () => {
      if (!username) throw new Error('Username is required');
      return systemPrompt.get(username);
    },
    enabled: !!username,
  });

  // Effect to set form value when system prompt is loaded
  useEffect(() => {
    if (currentUser?.data?.username) {
      systemPrompt.get(currentUser.data.username)
        .then(response => {
          setValue('systemPrompt', response.data.systemPrompt || '');
        })
        .catch(error => {
          console.error('Failed to fetch system prompt:', error);
        });
    }
  }, [currentUser?.data?.username, setValue]);

  // Update system prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: async (newPrompt: string) => {
      if (!username) throw new Error('Username is required');
      return systemPrompt.update(username, newPrompt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemPrompt'] });
      toast({
        variant: 'success',
        title: 'Success',
        description: 'System prompt updated successfully',
      });
    },
    onError: (err: any) => {
      toast({
        variant: 'error',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update system prompt',
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserEditDTO) => {
      if (!username) throw new Error('Username is required');
      return auth.updateUser(username, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast({
        variant: 'success',
        title: 'Success',
        description: 'User information updated successfully',
      });
    },
    onError: (err: any) => {
      toast({
        variant: 'error',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update user information',
      });
    },
  });

  const onSystemPromptSubmit = (data: SystemPromptFormData) => {
    updatePromptMutation.mutate(data.systemPrompt);
  };

  const handleUserUpdate = async (data: UserEditDTO) => {
    await updateUserMutation.mutateAsync(data);
  };

  if (isLoadingUser) {
    return <div className="text-center p-8">Loading user data...</div>;
  }

  if (!currentUser?.data) {
    return <div className="text-center p-8">User not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Edit Form */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
            <UserEditForm 
              user={currentUser.data} 
              onSave={handleUserUpdate}
              isUpdating={updateUserMutation.isPending}
            />
          </div>

          {/* System Prompt Form */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">System Prompt</h2>
            {isLoadingPrompt ? (
              <div className="text-center p-4">Loading prompt...</div>
            ) : (
              <form onSubmit={handleSubmit(onSystemPromptSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
                <div>
                  <Label htmlFor="systemPrompt">Your System Prompt</Label>
                  <Textarea
                    id="systemPrompt"
                    className="mt-1 h-32"
                    placeholder="Enter your system prompt here..."
                    {...register('systemPrompt')}
                  />
                  {errors.systemPrompt?.message && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.systemPrompt.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updatePromptMutation.isPending}
                  >
                    {updatePromptMutation.isPending ? 'Saving...' : 'Save Prompt'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Order History */}
        <div className="mt-12">
          <OrderList />
        </div>
      </div>
    </div>
  );
} 