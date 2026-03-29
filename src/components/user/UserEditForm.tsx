import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { User, UserEditDTO } from '../../types/auth';
import { userEditSchema, UserEditFormData } from '../../validators/user';

interface UserEditFormProps {
  user: User;
  onSave: (data: UserEditDTO) => Promise<void>;
  isUpdating?: boolean;
}

export function UserEditForm({ user, onSave, isUpdating = false }: UserEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (data: UserEditFormData) => {
    try {
      await onSave(data);
    } catch {
      // Error handling is done in the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5" data-testid="user-edit-form">
      <div data-testid="user-edit-email-field">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          className="mt-2 rounded-[1.25rem] border-stone-200 bg-white"
          error={errors.email?.message}
          data-testid="user-edit-email-input"
          {...register('email')}
        />
        {errors.email?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert" data-testid="user-edit-email-error">{errors.email.message}</p>
        )}
      </div>

      <div data-testid="user-edit-firstName-field">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          className="mt-2 rounded-[1.25rem] border-stone-200 bg-white"
          error={errors.firstName?.message}
          data-testid="user-edit-firstName-input"
          {...register('firstName')}
        />
        {errors.firstName?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert" data-testid="user-edit-firstName-error">{errors.firstName.message}</p>
        )}
      </div>

      <div data-testid="user-edit-lastName-field">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          className="mt-2 rounded-[1.25rem] border-stone-200 bg-white"
          error={errors.lastName?.message}
          data-testid="user-edit-lastName-input"
          {...register('lastName')}
        />
        {errors.lastName?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert" data-testid="user-edit-lastName-error">{errors.lastName.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isUpdating}
          data-testid="user-edit-submit"
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
} 
