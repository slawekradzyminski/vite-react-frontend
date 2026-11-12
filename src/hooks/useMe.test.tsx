import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '../lib/api';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { renderWithRoute } from '../test/renderWithRoute';
import { useMe } from './useMe';

vi.mock('../lib/api', () => ({ auth: { me: vi.fn() } }));

function Greeting() {
  const { data } = useMe();
  return <p data-testid="greeting">Hello {data?.data.firstName}</p>;
}

describe('useMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'token');
    vi.mocked(auth.me).mockResolvedValue({ data: { id: 1, username: 'alice', email: 'alice@example.com', firstName: 'Alice', lastName: 'Tester', roles: [] } } as never);
  });

  it('asks once when a page under the route guard reads the user after the guard has it (T-067)', async () => {
    // given / when: the page mounts only after the guard's request has finished
    renderWithRoute(<><ProtectedRoute><Greeting /></ProtectedRoute><Greeting /></>);

    // then
    expect(await screen.findAllByText('Hello Alice')).toHaveLength(2);
    expect(auth.me).toHaveBeenCalledTimes(1);
  });

  it('loads the user by default', async () => {
    // given / when
    renderWithRoute(<Greeting />);

    // then
    expect(await screen.findByText('Hello Alice')).toBeInTheDocument();
    expect(auth.me).toHaveBeenCalledTimes(1);
  });
});
