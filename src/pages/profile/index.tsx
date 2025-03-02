import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth, systemPrompt, orders } from '../../lib/api';
import { UserEditForm } from '../../components/user/UserEditForm';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/useToast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { systemPromptSchema, SystemPromptFormData } from '../../validators/user';
import type { UserEditDTO } from '../../types/auth';
import type { Order } from '../../types/order';

export function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;

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

  // Fetch user orders
  const { data: userOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', currentPage, pageSize],
    queryFn: () => orders.getUserOrders(currentPage, pageSize),
    enabled: !!currentUser?.data,
  });

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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Order History</h2>
          {isLoadingOrders ? (
            <div className="text-center p-4">Loading orders...</div>
          ) : userOrders?.data?.content?.length ? (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userOrders.data.content.map((order: Order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {userOrders.data.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-700">
                    Showing page {currentPage + 1} of {userOrders.data.totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= userOrders.data.totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-500">You have no orders yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 