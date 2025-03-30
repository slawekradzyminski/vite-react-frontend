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
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate data-testid="email-form">
      <div data-testid="email-to-field">
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          type="email"
          className="mt-1"
          placeholder="Recipient email"
          error={errors.to?.message}
          list="users"
          {...register('to')}
          data-testid="email-to-input"
        />
        {errors.to?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert" data-testid="email-to-error">{errors.to.message}</p>
        )}
        <datalist id="users" data-testid="users-datalist">
          {users?.data && users?.data.map((user) => (
            <option key={user.email} value={user.email} />
          ))}
        </datalist>
      </div>

      <div data-testid="email-subject-field">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          className="mt-1"
          placeholder="Email subject"
          error={errors.subject?.message}
          {...register('subject')}
          data-testid="email-subject-input"
        />
        {errors.subject?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert" data-testid="email-subject-error">{errors.subject.message}</p>
        )}
      </div>

      <div data-testid="email-message-field">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          className="mt-1"
          placeholder="Your message"
          {...register('message')}
          data-testid="email-message-input"
        />
        {errors.message?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert" data-testid="email-message-error">{errors.message.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
        data-testid="email-submit-button"
      >
        {isLoading ? 'Sending...' : 'Send Email'}
      </Button>
    </form>
  );
} 