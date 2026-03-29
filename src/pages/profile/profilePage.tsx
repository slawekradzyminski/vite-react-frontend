import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth, prompts } from '../../lib/api';
import { UserEditForm } from '../../components/user/UserEditForm';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/useToast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { systemPromptSchema, SystemPromptFormData, toolSystemPromptSchema, ToolSystemPromptFormData } from '../../validators/user';
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

  // Setup form for chat system prompt
  const {
    register: registerChatPrompt,
    handleSubmit: handleChatPromptSubmit,
    setValue: setChatPromptValue,
    formState: { errors: chatPromptErrors },
  } = useForm<SystemPromptFormData>({
    resolver: zodResolver(systemPromptSchema),
    defaultValues: {
      systemPrompt: '',
    },
  });

  // Setup form for tool system prompt
  const {
    register: registerToolPrompt,
    handleSubmit: handleToolPromptSubmit,
    setValue: setToolPromptValue,
    formState: { errors: toolPromptErrors },
  } = useForm<ToolSystemPromptFormData>({
    resolver: zodResolver(toolSystemPromptSchema),
    defaultValues: {
      toolSystemPrompt: '',
    },
  });

  // Fetch chat system prompt
  const { isLoading: isLoadingChatPrompt } = useQuery({
    queryKey: ['chatSystemPrompt', username],
    queryFn: async () => prompts.chat.get(),
    enabled: !!username,
  });

  // Fetch tool system prompt
  const { isLoading: isLoadingToolPrompt } = useQuery({
    queryKey: ['toolSystemPrompt', username],
    queryFn: async () => prompts.tool.get(),
    enabled: !!username,
  });

  // Effect to set chat prompt value when loaded
  useEffect(() => {
    if (currentUser?.data?.username) {
      prompts.chat.get()
        .then(response => {
          setChatPromptValue('systemPrompt', response.data.chatSystemPrompt || '');
        })
        .catch(error => {
          console.error('Failed to fetch chat system prompt:', error);
        });
    }
  }, [currentUser?.data?.username, setChatPromptValue]);

  // Effect to set tool prompt value when loaded
  useEffect(() => {
    if (currentUser?.data?.username) {
      prompts.tool.get()
        .then(response => {
          setToolPromptValue('toolSystemPrompt', response.data.toolSystemPrompt || '');
        })
        .catch(error => {
          console.error('Failed to fetch tool system prompt:', error);
        });
    }
  }, [currentUser?.data?.username, setToolPromptValue]);

  // Update chat system prompt mutation
  const updateChatPromptMutation = useMutation({
    mutationFn: async (newPrompt: string) => {
      return prompts.chat.update(newPrompt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSystemPrompt'] });
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Chat system prompt updated successfully',
      });
    },
    onError: (err: any) => {
      toast({
        variant: 'error',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update chat system prompt',
      });
    },
  });

  // Update tool system prompt mutation
  const updateToolPromptMutation = useMutation({
    mutationFn: async (newPrompt: string) => {
      return prompts.tool.update(newPrompt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toolSystemPrompt'] });
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Tool system prompt updated successfully',
      });
    },
    onError: (err: any) => {
      toast({
        variant: 'error',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update tool system prompt',
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

  const onChatSystemPromptSubmit = (data: SystemPromptFormData) => {
    updateChatPromptMutation.mutate(data.systemPrompt);
  };

  const onToolSystemPromptSubmit = (data: ToolSystemPromptFormData) => {
    updateToolPromptMutation.mutate(data.toolSystemPrompt);
  };

  const handleUserUpdate = async (data: UserEditDTO) => {
    await updateUserMutation.mutateAsync(data);
  };

  if (isLoadingUser) {
    return <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/84 px-6 py-12 text-center text-slate-500" data-testid="profile-loading">Loading user data...</div>;
  }

  if (!currentUser?.data) {
    return <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/84 px-6 py-12 text-center text-slate-500" data-testid="profile-not-found">User not found</div>;
  }

  return (
    <div className="space-y-6 pb-10" data-testid="profile-page">
      <section
        className="rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(244,240,235,0.98))] px-6 py-7 shadow-[0_28px_70px_-55px_rgba(15,23,42,0.45)] md:px-8"
        data-testid="profile-container"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Account</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="profile-title">Profile</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Update your contact details, keep assistant prompts current, and review recent order activity from one workspace.
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Signed in as</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{currentUser.data.firstName} {currentUser.data.lastName}</p>
            <p className="text-sm text-slate-600">{currentUser.data.email}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" data-testid="profile-sections">
        <section
          className="rounded-[2rem] border border-stone-200/80 bg-white/84 p-6 shadow-[0_28px_70px_-55px_rgba(15,23,42,0.45)] md:p-7"
          data-testid="profile-user-section"
        >
          <h2 className="mb-4 text-xl font-semibold text-slate-950" data-testid="profile-user-title">Personal Information</h2>
          <UserEditForm
            user={currentUser.data}
            onSave={handleUserUpdate}
            isUpdating={updateUserMutation.isPending}
          />
        </section>

        <section
          className="rounded-[2rem] border border-stone-200/80 bg-white/84 p-6 shadow-[0_28px_70px_-55px_rgba(15,23,42,0.45)] md:p-7"
          data-testid="profile-prompt-section"
        >
          <h2 className="mb-4 text-xl font-semibold text-slate-950" data-testid="profile-prompt-title">System Prompts</h2>
          {isLoadingChatPrompt ? (
            <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-4 text-center text-slate-500" data-testid="profile-prompt-loading">Loading prompt...</div>
          ) : (
            <form onSubmit={handleChatPromptSubmit(onChatSystemPromptSubmit)} className="space-y-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5" data-testid="profile-prompt-form">
              <div data-testid="profile-prompt-field">
                <Label htmlFor="systemPrompt">Your System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  className="mt-2 h-32 rounded-[1.25rem] border-stone-200 bg-white"
                  placeholder="Enter your system prompt here..."
                  {...registerChatPrompt('systemPrompt')}
                  data-testid="profile-prompt-input"
                />
                {chatPromptErrors.systemPrompt?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-testid="profile-prompt-error">{chatPromptErrors.systemPrompt.message}</p>
                )}
              </div>

              <div className="flex justify-end" data-testid="profile-prompt-actions">
                <Button
                  type="submit"
                  disabled={updateChatPromptMutation.isPending}
                  data-testid="profile-prompt-submit"
                >
                  {updateChatPromptMutation.isPending ? 'Saving...' : 'Save Prompt'}
                </Button>
              </div>
            </form>
          )}

          {isLoadingToolPrompt ? (
            <div className="mt-6 rounded-[1.4rem] border border-stone-200 bg-stone-50 p-4 text-center text-slate-500" data-testid="profile-tool-prompt-loading">Loading tool prompt...</div>
          ) : (
            <form onSubmit={handleToolPromptSubmit(onToolSystemPromptSubmit)} className="mt-6 space-y-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5" data-testid="profile-tool-prompt-form">
              <div data-testid="profile-tool-prompt-field">
                <Label htmlFor="toolSystemPrompt">Tool System Prompt</Label>
                <Textarea
                  id="toolSystemPrompt"
                  className="mt-2 h-32 rounded-[1.25rem] border-stone-200 bg-white"
                  placeholder="Enter your tool prompt here..."
                  {...registerToolPrompt('toolSystemPrompt')}
                  data-testid="profile-tool-prompt-input"
                />
                {toolPromptErrors.toolSystemPrompt?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-testid="profile-tool-prompt-error">{toolPromptErrors.toolSystemPrompt.message}</p>
                )}
              </div>

              <div className="flex justify-end" data-testid="profile-tool-prompt-actions">
                <Button
                  type="submit"
                  disabled={updateToolPromptMutation.isPending}
                  data-testid="profile-tool-prompt-submit"
                >
                  {updateToolPromptMutation.isPending ? 'Saving...' : 'Save Tool Prompt'}
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>

      <section
        className="rounded-[2rem] border border-stone-200/80 bg-white/84 p-6 shadow-[0_28px_70px_-55px_rgba(15,23,42,0.45)] md:p-7"
        data-testid="profile-orders-section"
      >
        <OrderList />
      </section>
    </div>
  );
}
