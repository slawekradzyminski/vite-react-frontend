import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithQueryClient as render } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { CardPaymentForm } from './CardPaymentForm';

const now = () => new Date(2027, 0, 15);

function renderForm(props: Partial<Parameters<typeof CardPaymentForm>[0]> = {}) {
  const onSubmit = vi.fn();
  render(<CardPaymentForm amountDue={59.97} submitting={false} onSubmit={onSubmit} now={now} {...props} />);
  return { onSubmit };
}

describe('CardPaymentForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('labels every field and shows the amount on the pay button', () => {
    // given / when
    renderForm();
    // then
    expect(screen.getByLabelText('Card number')).toBeInTheDocument();
    expect(screen.getByLabelText('Expiry (MM/YY)')).toBeInTheDocument();
    expect(screen.getByLabelText('CVC')).toBeInTheDocument();
    expect(screen.getByLabelText('Name on card')).toBeInTheDocument();
    expect(screen.getByTestId('payment-submit')).toHaveTextContent('Pay $59.97');
  });

  it('formats the card number in groups of four and the expiry as MM/YY while typing', async () => {
    // given
    renderForm();
    // when
    await userEvent.type(screen.getByTestId('payment-card-number-input'), '4242424242424242');
    await userEvent.type(screen.getByTestId('payment-card-expiry-input'), '1229');
    // then
    expect(screen.getByTestId('payment-card-number-input')).toHaveValue('4242 4242 4242 4242');
    expect(screen.getByTestId('payment-card-expiry-input')).toHaveValue('12/29');
  });

  it('submits the card body when everything is valid', async () => {
    // given
    const { onSubmit } = renderForm();
    // when
    await userEvent.type(screen.getByTestId('payment-card-number-input'), '4242424242424242');
    await userEvent.type(screen.getByTestId('payment-card-expiry-input'), '0127');
    await userEvent.type(screen.getByTestId('payment-card-cvc-input'), '123');
    await userEvent.type(screen.getByTestId('payment-card-holder-input'), 'Alice Smith');
    await userEvent.click(screen.getByTestId('payment-submit'));
    // then
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      number: '4242424242424242', expiryMonth: 1, expiryYear: 2027, cvc: '123', holderName: 'Alice Smith',
    }));
  });

  it('shows linked field errors for an invalid number, past expiry and missing fields', async () => {
    // given
    const { onSubmit } = renderForm();
    // when
    await userEvent.type(screen.getByTestId('payment-card-number-input'), '4242424242424241');
    await userEvent.type(screen.getByTestId('payment-card-expiry-input'), '1226');
    await userEvent.click(screen.getByTestId('payment-submit'));
    // then
    expect(await screen.findByTestId('payment-card-number-error')).toHaveTextContent('Card number is not valid');
    expect(screen.getByTestId('payment-card-expiry-error')).toHaveTextContent('This card has expired');
    expect(screen.getByTestId('payment-card-cvc-error')).toHaveTextContent('CVC is required');
    expect(screen.getByTestId('payment-card-holder-error')).toHaveTextContent('Name on card is required');
    expect(screen.getByTestId('payment-card-number-input')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('payment-card-number-input')).toHaveAccessibleDescription('Card number is not valid');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('fills a test card from the collapsible helper', async () => {
    // given
    const { onSubmit } = renderForm();
    const toggle = screen.getByTestId('payment-test-cards-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // when
    await userEvent.click(toggle);
    await userEvent.click(screen.getByTestId('payment-test-card-4000000000003220'));
    await userEvent.click(screen.getByTestId('payment-submit'));
    // then
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('payment-card-number-input')).toHaveValue('4000 0000 0000 3220');
    expect(screen.getByTestId('payment-card-expiry-input')).toHaveValue('12/30');
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      number: '4000000000003220', expiryMonth: 12, expiryYear: 2030, cvc: '123', holderName: 'Test Cardholder',
    })));
  });

  it('keeps a name the customer already typed when filling a test card', async () => {
    // given
    renderForm();
    await userEvent.type(screen.getByTestId('payment-card-holder-input'), 'Bob');
    // when
    await userEvent.click(screen.getByTestId('payment-test-cards-toggle'));
    await userEvent.click(screen.getByTestId('payment-test-card-4242424242424242'));
    // then
    expect(screen.getByTestId('payment-card-holder-input')).toHaveValue('Bob');
  });

  it('shows the service error and disables the button while submitting', () => {
    // given / when
    renderForm({ submitting: true, error: 'Card number failed the Luhn check' });
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('Card number failed the Luhn check');
    expect(screen.getByTestId('payment-submit')).toBeDisabled();
    expect(screen.getByTestId('payment-submit')).toHaveTextContent('Processing payment…');
  });
});
