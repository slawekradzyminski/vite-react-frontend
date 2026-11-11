import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { usePaymentFlow } from './usePaymentFlow';
import { payments } from '../lib/api';
import { createTestQueryClient } from '../test/renderWithRoute';
import { axiosError, ok, paymentFixture } from '../test/paymentFixtures';
import type { PaymentCard } from '../types/payment';

vi.mock('../lib/api', () => ({
  payments: { create: vi.fn(), get: vi.fn(), confirmThreeDs: vi.fn(), forOrder: vi.fn() },
}));

const card: PaymentCard = { number: '4242424242424242', expiryMonth: 12, expiryYear: 2030, cvc: '123', holderName: 'Alice' };

function renderFlow(options = { pollIntervalMs: 5, timeoutMs: 1000 }) {
  const queryClient = createTestQueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const hook = renderHook(() => usePaymentFlow(42, options), { wrapper });
  return { ...hook, invalidate };
}

describe('usePaymentFlow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('captures a payment and refreshes the order', async () => {
    // given
    vi.mocked(payments.create).mockResolvedValue(ok(paymentFixture()));
    const { result, invalidate } = renderFlow();
    // when
    await act(() => result.current.pay(card));
    // then
    expect(result.current.state.step).toBe('captured');
    expect(payments.create).toHaveBeenCalledWith({ orderId: 42, card }, expect.stringMatching(/^pay_[A-Za-z0-9_-]+$/));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['order', 42] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['payments', 42] });
  });

  it('reports a declined card as failed', async () => {
    // given
    vi.mocked(payments.create).mockResolvedValue(ok(paymentFixture({ status: 'FAILED', failureCode: 'CARD_DECLINED' })));
    const { result } = renderFlow();
    // when
    await act(() => result.current.pay(card));
    // then
    expect(result.current.state).toMatchObject({ step: 'failed', payment: { failureCode: 'CARD_DECLINED' } });
  });

  it('asks for 3-D Secure and captures after the right code', async () => {
    // given
    const challenged = paymentFixture({ status: 'REQUIRES_ACTION', nextAction: { type: 'THREE_DS_CHALLENGE', hint: 'Enter code 123456' } });
    vi.mocked(payments.create).mockResolvedValue(ok(challenged));
    vi.mocked(payments.confirmThreeDs).mockResolvedValue(ok(paymentFixture()));
    const { result } = renderFlow();
    await act(() => result.current.pay(card));
    expect(result.current.state.step).toBe('challenge');
    // when
    await act(() => result.current.confirmThreeDs('123456'));
    // then
    expect(payments.confirmThreeDs).toHaveBeenCalledWith(challenged.id, '123456');
    expect(result.current.state.step).toBe('captured');
  });

  it('shows where a payment ended up when the challenge was already answered', async () => {
    // given
    vi.mocked(payments.create).mockResolvedValue(ok(paymentFixture({ status: 'REQUIRES_ACTION' })));
    vi.mocked(payments.confirmThreeDs).mockRejectedValue(axiosError(409, { message: 'Payment does not require action' }));
    vi.mocked(payments.get).mockResolvedValue(ok(paymentFixture({ status: 'FAILED', failureCode: 'THREE_DS_EXPIRED' })));
    const { result } = renderFlow();
    await act(() => result.current.pay(card));
    // when
    await act(() => result.current.confirmThreeDs('123456'));
    // then
    expect(result.current.state).toMatchObject({ step: 'failed', payment: { failureCode: 'THREE_DS_EXPIRED' } });
  });

  it('keeps the challenge open with an error when the code cannot be sent', async () => {
    // given
    vi.mocked(payments.create).mockResolvedValue(ok(paymentFixture({ status: 'REQUIRES_ACTION' })));
    vi.mocked(payments.confirmThreeDs).mockRejectedValue(axiosError(500));
    const { result } = renderFlow();
    await act(() => result.current.pay(card));
    // when
    await act(() => result.current.confirmThreeDs('1'));
    // then
    expect(result.current.state).toMatchObject({ step: 'challenge', error: 'The verification could not be sent. Try again.' });
  });

  it('ignores a 3-D Secure confirmation outside a challenge', async () => {
    // given
    const { result } = renderFlow();
    // when
    await act(() => result.current.confirmThreeDs('123456'));
    // then
    expect(payments.confirmThreeDs).not.toHaveBeenCalled();
    expect(result.current.state.step).toBe('form');
  });

  it('polls a processing payment until it is captured, surviving a failed poll', async () => {
    // given
    const processing = paymentFixture({ status: 'PROCESSING' });
    vi.mocked(payments.create).mockResolvedValue(ok(processing));
    vi.mocked(payments.get)
      .mockResolvedValueOnce(ok(processing))
      .mockRejectedValueOnce(axiosError())
      .mockResolvedValue(ok(paymentFixture()));
    const { result } = renderFlow();
    // when
    await act(() => result.current.pay(card));
    // then
    expect(result.current.state.step).toBe('processing');
    await waitFor(() => expect(result.current.state.step).toBe('captured'));
    expect(payments.get).toHaveBeenCalledTimes(3);
    expect(payments.get).toHaveBeenCalledWith(processing.id);
  });

  it('stops polling after the timeout and can check again', async () => {
    // given
    const processing = paymentFixture({ status: 'PROCESSING' });
    vi.mocked(payments.create).mockResolvedValue(ok(processing));
    vi.mocked(payments.get).mockResolvedValue(ok(processing));
    const { result } = renderFlow({ pollIntervalMs: 5, timeoutMs: 30 });
    // when
    await act(() => result.current.pay(card));
    // then
    await waitFor(() => expect(result.current.state.step).toBe('timeout'));
    const pollsAtTimeout = vi.mocked(payments.get).mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(payments.get).toHaveBeenCalledTimes(pollsAtTimeout);
    // when checking again
    vi.mocked(payments.get).mockResolvedValue(ok(paymentFixture()));
    act(() => result.current.checkAgain());
    // then
    await waitFor(() => expect(result.current.state.step).toBe('captured'));
  });

  it('turns 409 into a not-payable outcome with the server message', async () => {
    // given
    vi.mocked(payments.create).mockRejectedValue(axiosError(409, { message: 'Order is not payable' }));
    const { result } = renderFlow();
    // when
    await act(() => result.current.pay(card));
    // then
    expect(result.current.state).toEqual({ step: 'notPayable', message: 'Order is not payable' });
  });

  it('shows validation errors from the service on the form', async () => {
    // given
    vi.mocked(payments.create).mockRejectedValue(axiosError(400, { message: 'Card number failed the Luhn check' }));
    const { result } = renderFlow();
    // when
    await act(() => result.current.pay(card));
    // then
    expect(result.current.state).toEqual({ step: 'form', error: 'Card number failed the Luhn check' });
  });

  it('reuses the Idempotency-Key when the same submission is retried after a network error', async () => {
    // given
    vi.mocked(payments.create).mockRejectedValueOnce(axiosError()).mockRejectedValueOnce(axiosError(503)).mockResolvedValue(ok(paymentFixture()));
    const { result } = renderFlow();
    // when
    await act(() => result.current.pay(card));
    expect(result.current.state).toMatchObject({ step: 'form', error: expect.stringContaining('retry safely') });
    await act(() => result.current.pay(card));
    await act(() => result.current.pay(card));
    // then
    const keys = vi.mocked(payments.create).mock.calls.map((call) => call[1]);
    expect(new Set(keys).size).toBe(1);
    expect(result.current.state.step).toBe('captured');
  });

  it('starts a new attempt with a new key when the card changes or the service answered', async () => {
    // given
    vi.mocked(payments.create)
      .mockRejectedValueOnce(axiosError())
      .mockResolvedValueOnce(ok(paymentFixture({ status: 'FAILED', failureCode: 'CARD_DECLINED' })))
      .mockRejectedValueOnce(axiosError(403, { message: 'Not your order' }))
      .mockRejectedValueOnce(axiosError(403, {}));
    const { result } = renderFlow();
    // when
    await act(() => result.current.pay(card));
    await act(() => result.current.pay({ ...card, number: '4000000000000002' }));
    act(() => result.current.reset());
    await act(() => result.current.pay({ ...card, number: '4000000000000002' }));
    expect(result.current.state).toEqual({ step: 'form', error: 'Not your order' });
    await act(() => result.current.pay({ ...card, number: '4000000000000002' }));
    // then
    const keys = vi.mocked(payments.create).mock.calls.map((call) => call[1]);
    expect(new Set(keys).size).toBe(4);
    expect(result.current.state).toEqual({ step: 'form', error: 'The payment could not be started.' });
  });

  it('resumes a payment that is waiting for 3-D Secure', () => {
    // given
    const { result } = renderFlow();
    // when
    act(() => result.current.resume(paymentFixture({ status: 'REQUIRES_ACTION' })));
    // then
    expect(result.current.state.step).toBe('challenge');
  });

  it('stops polling when unmounted', async () => {
    // given
    const processing = paymentFixture({ status: 'PROCESSING' });
    vi.mocked(payments.create).mockResolvedValue(ok(processing));
    vi.mocked(payments.get).mockResolvedValue(ok(processing));
    const { result, unmount } = renderFlow({ pollIntervalMs: 20, timeoutMs: 1000 });
    await act(() => result.current.pay(card));
    // when
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 60));
    // then
    expect(payments.get).not.toHaveBeenCalled();
  });
});
