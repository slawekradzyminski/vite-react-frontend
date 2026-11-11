import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { payments } from '../lib/api';
import { newIdempotencyKey, wasCaptured } from '../lib/payment';
import { serverMessage } from '../lib/requestErrors';
import type { Payment, PaymentCard } from '../types/payment';

export type PaymentFlowState =
  | { step: 'form'; error?: string }
  | { step: 'submitting' }
  | { step: 'challenge'; payment: Payment; error?: string; confirming?: boolean }
  | { step: 'processing'; payment: Payment }
  | { step: 'timeout'; payment: Payment }
  | { step: 'captured'; payment: Payment }
  | { step: 'failed'; payment: Payment }
  | { step: 'notPayable'; message: string };

export type PaymentFlowOptions = {
  pollIntervalMs?: number;
  timeoutMs?: number;
};

type Attempt = { key: string; body: string };

/** True when the request may have reached payment-service, so a retry must replay the same key. */
function isRetryable(error: unknown) {
  if (!axios.isAxiosError(error)) return true;
  const status = error.response?.status;
  return status === undefined || status >= 500;
}

/**
 * Drives one card payment for an order: submit with an Idempotency-Key, then follow the
 * provider's answer through 3-D Secure, asynchronous processing, capture or failure.
 */
export function usePaymentFlow(orderId: number, { pollIntervalMs = 2000, timeoutMs = 60000 }: PaymentFlowOptions = {}) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<PaymentFlowState>({ step: 'form' });
  const attempt = useRef<Attempt | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadline = useRef(0);
  const mounted = useRef(true);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const refreshOrder = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['payments', orderId] });
  }, [orderId, queryClient]);

  // Polling settles the payment it fetched; the ref breaks the settle <-> poll cycle.
  const settleRef = useRef<(payment: Payment) => void>(() => undefined);

  const schedulePoll = useCallback((payment: Payment) => {
    stopPolling();
    if (Date.now() >= deadline.current) {
      setState({ step: 'timeout', payment });
      return;
    }
    pollTimer.current = setTimeout(async () => {
      try {
        const { data } = await payments.get(payment.id);
        if (mounted.current) settleRef.current(data);
      } catch {
        // A failed poll is retried on the next tick; the deadline still applies.
        if (mounted.current) settleRef.current(payment);
      }
    }, pollIntervalMs);
  }, [pollIntervalMs, stopPolling]);

  const settle = useCallback((payment: Payment) => {
    stopPolling();
    if (!mounted.current) return;
    switch (payment.status) {
      case 'REQUIRES_ACTION':
        setState({ step: 'challenge', payment });
        return;
      case 'PROCESSING':
        setState({ step: 'processing', payment });
        schedulePoll(payment);
        return;
      default:
        setState(wasCaptured(payment) ? { step: 'captured', payment } : { step: 'failed', payment });
        refreshOrder();
    }
  }, [refreshOrder, schedulePoll, stopPolling]);

  useEffect(() => {
    settleRef.current = settle;
  }, [settle]);

  /** Starts (or resumes) following a payment, restarting the processing deadline. */
  const follow = useCallback((payment: Payment) => {
    deadline.current = Date.now() + timeoutMs;
    settle(payment);
  }, [settle, timeoutMs]);

  const pay = useCallback(async (card: PaymentCard) => {
    const request = { orderId, card };
    const body = JSON.stringify(request);
    // Retrying the same submission replays the same key; changed card details start a new attempt.
    if (!attempt.current || attempt.current.body !== body) {
      attempt.current = { key: newIdempotencyKey(), body };
    }
    setState({ step: 'submitting' });
    try {
      const { data } = await payments.create(request, attempt.current.key);
      attempt.current = null;
      follow(data);
    } catch (error) {
      if (!mounted.current) return;
      if (!isRetryable(error)) attempt.current = null;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 409) {
        setState({ step: 'notPayable', message: serverMessage(error, 'This order cannot be paid right now.') });
        refreshOrder();
      } else if (status === 400) {
        setState({ step: 'form', error: serverMessage(error, 'Check the card details and try again.') });
      } else if (isRetryable(error)) {
        setState({ step: 'form', error: 'We could not reach the payment service. Submit again to retry safely; you will not be charged twice.' });
      } else {
        setState({ step: 'form', error: serverMessage(error, 'The payment could not be started.') });
      }
    }
  }, [follow, orderId, refreshOrder]);

  const confirmThreeDs = useCallback(async (code: string) => {
    if (state.step !== 'challenge') return;
    const { payment } = state;
    setState({ step: 'challenge', payment, confirming: true });
    try {
      const { data } = await payments.confirmThreeDs(payment.id, code);
      follow(data);
    } catch (error) {
      if (!mounted.current) return;
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        // The challenge was already answered or expired; show where the payment ended up.
        try {
          const { data } = await payments.get(payment.id);
          follow(data);
          return;
        } catch {
          // fall through to the generic message
        }
      }
      setState({ step: 'challenge', payment, error: serverMessage(error, 'The verification could not be sent. Try again.') });
    }
  }, [follow, state]);

  /** Polls again after the processing timeout message. */
  const checkAgain = useCallback(() => {
    if (state.step === 'timeout') follow(state.payment);
  }, [follow, state]);

  const reset = useCallback(() => {
    stopPolling();
    attempt.current = null;
    setState({ step: 'form' });
  }, [stopPolling]);

  return { state, pay, confirmThreeDs, resume: follow, checkAgain, reset };
}
