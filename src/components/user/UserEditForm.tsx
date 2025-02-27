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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          className="mt-1"
          error={errors.email?.message}
          {...register('email')}
        />
        {errors.email?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          className="mt-1"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        {errors.firstName?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.firstName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          className="mt-1"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
        {errors.lastName?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.lastName.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isUpdating}
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
} 