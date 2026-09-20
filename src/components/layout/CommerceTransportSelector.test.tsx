import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommerceTransportSelector } from './CommerceTransportSelector';
import { changeCommerceTransport } from '../../lib/commerceTransport';

vi.mock('../../lib/commerceTransport', () => ({ commerceTransport: 'rest', changeCommerceTransport: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

function setup() {
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><CommerceTransportSelector /></QueryClientProvider>);
  return client;
}

describe('shop API selector', () => {
  it('shows REST by default and requests an explicit switch', async () => {
    // given
    setup();
    expect(screen.getByLabelText('Shop API')).toHaveValue('rest');
    // when
    await userEvent.selectOptions(screen.getByLabelText('Shop API'), 'graphql');
    // then
    expect(changeCommerceTransport).toHaveBeenCalledWith('graphql', 0);
  });

  it('disables switching while a shopping mutation is pending', async () => {
    // given
    const client = setup();
    let finish!: () => void;
    const pending = new Promise<void>(resolve => { finish = resolve; });
    // when
    act(() => { void client.getMutationCache().build(client, { mutationFn: () => pending }).execute(undefined); });
    // then
    await waitFor(() => expect(screen.getByLabelText('Shop API')).toBeDisabled());
    await act(async () => { finish(); await pending; });
    await waitFor(() => expect(screen.getByLabelText('Shop API')).toBeEnabled());
  });

  it('reports storage failures instead of silently changing the mode', async () => {
    // given
    setup();
    vi.mocked(changeCommerceTransport).mockImplementationOnce(() => { throw new Error('Denied'); });
    // when
    await userEvent.selectOptions(screen.getByLabelText('Shop API'), 'graphql');
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('Cannot save the API selection');
    expect(screen.getByLabelText('Shop API')).toHaveValue('rest');
  });
});
