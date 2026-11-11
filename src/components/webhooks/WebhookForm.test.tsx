import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebhookForm } from './WebhookForm';
import { axiosFailure, eventTypesFixture } from '../../test/webhookFixtures';

const renderForm = (props: Partial<Parameters<typeof WebhookForm>[0]> = {}) => {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  render(<WebhookForm idPrefix="wh" mode="create" eventTypes={eventTypesFixture} {...props} onSubmit={onSubmit} />);
  return { onSubmit };
};

describe('WebhookForm', () => {
  it('submits the URL, selected events and description', async () => {
    // given
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    // when
    await user.type(screen.getByLabelText('Endpoint URL'), 'https://example.com/hook');
    await user.click(screen.getByRole('checkbox', { name: /order\.created/ }));
    await user.click(screen.getByRole('checkbox', { name: /order\.paid/ }));
    await user.type(screen.getByLabelText('Description (optional)'), 'Sync');
    await user.click(screen.getByRole('button', { name: 'Create webhook' }));

    // then
    expect(onSubmit).toHaveBeenCalledWith({ url: 'https://example.com/hook', events: ['order.created', 'order.paid'], description: 'Sync', active: true });
  });

  it('shows field errors without submitting', async () => {
    // given
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    // when
    await user.type(screen.getByLabelText('Endpoint URL'), 'example.com');
    await user.click(screen.getByTestId('wh-submit'));

    // then
    expect(await screen.findByTestId('wh-url-error')).toHaveTextContent('Use an http(s):// URL or an inbox:// URL');
    expect(screen.getByTestId('wh-events-error')).toHaveTextContent('Select at least one event');
    expect(screen.getByLabelText('Endpoint URL')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a backend SSRF rejection under the URL field', async () => {
    // given
    const user = userEvent.setup();
    const message = 'Webhook URL rejected: Host 10.0.0.1 resolves to a private address';
    renderForm({ onSubmit: vi.fn().mockRejectedValue(axiosFailure(400, { message })) });

    // when
    await user.type(screen.getByLabelText('Endpoint URL'), 'http://10.0.0.1/hook');
    await user.click(screen.getByRole('checkbox', { name: /order\.created/ }));
    await user.click(screen.getByTestId('wh-submit'));

    // then
    expect(await screen.findByTestId('wh-url-error')).toHaveTextContent(message);
    expect(screen.queryByTestId('wh-error')).not.toBeInTheDocument();
  });

  it('shows a conflict at form level', async () => {
    // given
    const user = userEvent.setup();
    renderForm({ onSubmit: vi.fn().mockRejectedValue(axiosFailure(409, { message: 'At most 5 webhooks per user' })) });

    // when
    await user.type(screen.getByLabelText('Endpoint URL'), 'https://example.com');
    await user.click(screen.getByRole('checkbox', { name: /order\.created/ }));
    await user.click(screen.getByTestId('wh-submit'));

    // then
    expect(await screen.findByTestId('wh-error')).toHaveTextContent('At most 5 webhooks per user');
  });

  it('shows an unrecognised 400 message at form level', async () => {
    // given
    const user = userEvent.setup();
    renderForm({ onSubmit: vi.fn().mockRejectedValue(axiosFailure(400, { message: 'Bad request' })) });

    // when
    await user.type(screen.getByLabelText('Endpoint URL'), 'https://example.com');
    await user.click(screen.getByRole('checkbox', { name: /order\.created/ }));
    await user.click(screen.getByTestId('wh-submit'));

    // then
    expect(await screen.findByTestId('wh-error')).toHaveTextContent('Bad request');
  });

  it('edits existing values, including the active flag, and can be cancelled', async () => {
    // given
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const { onSubmit } = renderForm({
      mode: 'edit',
      onCancel,
      initialValues: { url: 'inbox://tok1', events: ['order.paid'], description: '', active: false },
    });

    // when
    await user.click(screen.getByTestId('wh-active'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await user.click(screen.getByTestId('wh-cancel'));

    // then
    expect(screen.getByRole('checkbox', { name: /order\.paid/ })).toBeChecked();
    expect(onSubmit).toHaveBeenCalledWith({ url: 'inbox://tok1', events: ['order.paid'], description: '', active: true });
    expect(onCancel).toHaveBeenCalled();
  });

  it('reports when event types could not be loaded', () => {
    // given / when
    renderForm({ eventTypes: [], eventTypesError: true });

    // then
    expect(screen.getByTestId('wh-event-types-error')).toHaveTextContent('Unable to load the event types.');
    expect(screen.queryByTestId('wh-active')).not.toBeInTheDocument();
  });
});
