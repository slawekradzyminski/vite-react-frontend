import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserEditForm } from './UserEditForm';
import { Role, type User } from '../../types/auth';

const user: User = {
  id: 1,
  username: 'client',
  email: 'client@example.com',
  firstName: 'Client',
  lastName: 'User',
  roles: [Role.CLIENT],
} as User;

describe('UserEditForm', () => {
  it('links the email validation error to the email field', async () => {
    // given
    const onSave = vi.fn();
    render(<UserEditForm user={user} onSave={onSave} />);
    const email = screen.getByLabelText('Email');

    // when
    await userEvent.clear(email);
    await userEvent.type(email, 'invalid');
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    // then
    const error = await screen.findByTestId('user-edit-email-error');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAttribute('aria-describedby', error.id);
    expect(email).toHaveAccessibleDescription(error.textContent!);
    expect(screen.getByLabelText('First Name')).not.toHaveAttribute('aria-invalid');
    expect(onSave).not.toHaveBeenCalled();
  });
});
