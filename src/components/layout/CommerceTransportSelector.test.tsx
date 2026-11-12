import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommerceTransportSelector } from './CommerceTransportSelector';
import { changeCommerceTransport } from '../../lib/commerceTransport';
import { trackWrite } from '../../lib/pendingWrites';

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

  it('disables switching while a cart write outside useMutation is pending', async () => {
    // given
    setup();
    let finish!: () => void;
    let write!: Promise<void>;
    // when
    act(() => { write = trackWrite(() => new Promise<void>(resolve => { finish = resolve; })); });
    // then
    expect(screen.getByLabelText('Shop API')).toBeDisabled();
    await act(async () => { finish(); await write; });
    expect(screen.getByLabelText('Shop API')).toBeEnabled();
  });

  it('refuses a switch requested while a cart write is still running', async () => {
    // given
    setup();
    let finish!: () => void;
    const write = trackWrite(() => new Promise<void>(resolve => { finish = resolve; }));
    // when: the change arrives before React re-renders the disabled state
    act(() => { screen.getByLabelText('Shop API').dispatchEvent(new Event('change', { bubbles: true })); });
    // then
    expect(changeCommerceTransport).toHaveBeenLastCalledWith('rest', 1);
    await act(async () => { finish(); await write; });
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
