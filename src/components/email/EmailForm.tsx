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
import { Surface } from '../ui/surface';
import { fieldErrorId } from '../../lib/fieldError';
import { useMe } from '../../hooks/useMe';
import { hasRole } from '../../lib/roles';

interface EmailFormProps {
  /** Resolve to true once the email is queued: the form then clears for the next one (X-33). */
  onSubmit: (data: EmailFormData) => void | Promise<boolean>;
  isLoading?: boolean;
}

const EMPTY_EMAIL: EmailFormData = { to: '', subject: '', message: '' };

export function EmailForm({ onSubmit, isLoading = false }: EmailFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onSubmit',
    defaultValues: EMPTY_EMAIL,
  });

  // The recipient picker lists every account's address, so only admins load it; clients type
  // the address (X-12). A 3.19+ backend masks other users' emails for clients anyway.
  const { data: me } = useMe();
  const isAdmin = hasRole(me?.data?.roles, 'ADMIN');
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => auth.getUsers(),
    enabled: isAdmin,
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    // A failed send keeps what was typed so it can be corrected and sent again.
    if ((await onSubmit(data)) === true) {
      reset(EMPTY_EMAIL);
    }
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate data-testid="email-form">
      <Surface variant="inset" padding="md" data-testid="email-to-field">
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          type="email"
          className="mt-2"
          placeholder="Recipient email"
          error={errors.to?.message}
          list={isAdmin ? 'users' : undefined}
          {...register('to')}
          data-testid="email-to-input"
        />
        {errors.to?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert" id={fieldErrorId('to')} data-testid="email-to-error">{errors.to.message}</p>
        )}
        {isAdmin && (
          <datalist id="users" data-testid="users-datalist">
            {users?.data && users?.data.map((user) => (
              <option key={user.email} value={user.email} />
            ))}
          </datalist>
        )}
      </Surface>

      <Surface variant="inset" padding="md" data-testid="email-subject-field">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          className="mt-2"
          placeholder="Email subject"
          error={errors.subject?.message}
          {...register('subject')}
          data-testid="email-subject-input"
        />
        {errors.subject?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert" id={fieldErrorId('subject')} data-testid="email-subject-error">{errors.subject.message}</p>
        )}
      </Surface>

      <Surface variant="inset" padding="md" data-testid="email-message-field">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          className="mt-2 min-h-[180px]"
          placeholder="Your message"
          error={errors.message?.message}
          {...register('message')}
          data-testid="email-message-input"
        />
        {errors.message?.message && (
          <p className="mt-1 text-sm text-red-600" role="alert" id={fieldErrorId('message')} data-testid="email-message-error">{errors.message.message}</p>
        )}
      </Surface>

      <Button
        type="submit"
        className="h-11 w-full"
        disabled={isLoading}
        data-testid="email-submit-button"
      >
        {isLoading ? 'Sending...' : 'Send Email'}
      </Button>
    </form>
  );
} 
