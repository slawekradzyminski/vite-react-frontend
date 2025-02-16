import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { auth } from '../../lib/api';
import { emailSchema } from '../../validators/email';
import type { EmailFormData } from '../../types/email';

interface EmailFormProps {
  onSubmit: (data: EmailFormData) => void;
  isLoading?: boolean;
}

export function EmailForm({ onSubmit, isLoading = false }: EmailFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onSubmit',
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => auth.getUsers(),
  });

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      <div>
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          type="email"
          className="mt-1"
          placeholder="Recipient email"
          error={errors.to?.message}
          list="users"
          {...register('to')}
        />
        {errors.to?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.to.message}</p>
        )}
        <datalist id="users" data-testid="users-datalist">
          {users?.data.map((user) => (
            <option key={user.email} value={user.email} />
          ))}
        </datalist>
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          className="mt-1"
          placeholder="Email subject"
          error={errors.subject?.message}
          {...register('subject')}
        />
        {errors.subject?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.subject.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          className="mt-1"
          placeholder="Your message"
          error={errors.message?.message}
          {...register('message')}
        />
        {errors.message?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.message.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Email'}
      </Button>
    </form>
  );
} 