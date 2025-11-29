import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrafficMonitorPage } from './trafficPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as stompjs from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Mock dependencies
vi.mock('../../lib/api', () => ({
  default: {
    defaults: {
      baseURL: 'http://localhost:4001'
    }
  },
  traffic: {
    getInfo: vi.fn().mockResolvedValue({
      data: {
        webSocketEndpoint: '/ws-traffic',
        topic: '/topic/traffic',
        description: 'Test description'
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    })
  }
}));

vi.mock('sockjs-client', () => ({
  default: vi.fn()
}));

vi.mock('@stomp/stompjs', () => {
  const clientInstances: Array<MockClient> = [];
  
  class MockClient {
    connectHeaders = {};
    onConnect: (() => void) | null = null;
    onStompError: ((frame: any) => void) | null = null;
    onDisconnect: (() => void) | null = null;
    connected = false;
    subscriptions: Record<string, { topic: string; callback: (message: { body: string }) => void }> = {};
    
    constructor(config: any) {
      if (config.onConnect) this.onConnect = config.onConnect;
      if (config.onStompError) this.onStompError = config.onStompError;
      if (config.onDisconnect) this.onDisconnect = config.onDisconnect;
      if (config.connectHeaders) this.connectHeaders = config.connectHeaders;
      clientInstances.push(this);
    }
    
    activate() {
      this.connected = true;
      // Call onConnect callback asynchronously to simulate real behavior
      setTimeout(() => {
        if (this.onConnect) this.onConnect();
      }, 10);
    }
    
    deactivate() {
      this.connected = false;
      if (this.onDisconnect) this.onDisconnect();
    }
    
    subscribe(topic: string, callback: (message: { body: string }) => void) {
      const subId = `sub-${Math.random()}`;
      this.subscriptions[subId] = { topic, callback };
      return { id: subId };
    }
  }
  
  const ClientMock = vi.fn(function Client(this: unknown, config: any) {
    return new MockClient(config);
  });
  
  return {
    Client: ClientMock,
    // Helper to simulate messages for testing
    __getClients: () => clientInstances,
    __simulateMessage: (body: any) => {
      clientInstances.forEach(client => {
        Object.values(client.subscriptions).forEach(sub => {
          sub.callback({ body: JSON.stringify(body) });
        });
      });
    }
  };
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => 'fake-token'),
    setItem: vi.fn(),
    removeItem: vi.fn()
  },
  writable: true
});

describe('TrafficMonitorPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Reset mocks
    vi.clearAllMocks();
    window.localStorage.getItem = vi.fn(() => 'fake-token');
  });

  it('should render loading state initially', () => {
    // when
    render(
      <QueryClientProvider client={queryClient}>
        <TrafficMonitorPage />
      </QueryClientProvider>
    );
    
    // then
    expect(screen.getByText('Loading traffic monitor...')).toBeInTheDocument();
  });

  it('should initialize WebSocket connection when traffic info loads', async () => {
    // given
    render(
      <QueryClientProvider client={queryClient}>
        <TrafficMonitorPage />
      </QueryClientProvider>
    );
    
    // then + then
    await waitFor(() => {
      expect(SockJS).toHaveBeenCalledWith('http://localhost:4001/ws-traffic');
      expect(stompjs.Client).toHaveBeenCalled();
    });
  });

  it('should display traffic events received from WebSocket', async () => {
    // given
    render(
      <QueryClientProvider client={queryClient}>
        <TrafficMonitorPage />
      </QueryClientProvider>
    );
    
    // Wait for connection to be established
    await waitFor(() => expect(screen.getByText('Connected to traffic monitor')).toBeInTheDocument(), { timeout: 1000 });
    
    // Simulate WebSocket message
    const testEvent = {
      method: 'GET',
      path: '/api/test',
      status: 200,
      durationMs: 150,
      timestamp: new Date().toISOString()
    };
    
    // when
    await act(async () => {
      // @ts-expect-error - Using the helper function to simulate a message
      stompjs.__simulateMessage(testEvent);
    });
    
    // then
    expect(screen.getByText(testEvent.method)).toBeInTheDocument();
    expect(screen.getByText(testEvent.path)).toBeInTheDocument();
    expect(screen.getByText(testEvent.status.toString())).toBeInTheDocument();
    expect(screen.getByText(`${testEvent.durationMs}ms`)).toBeInTheDocument();
  });

  it('should clear events when the clear button is clicked', async () => {
    // given
    const user = userEvent.setup();
    
    // Create a fresh query client for this test
    const testQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <TrafficMonitorPage />
      </QueryClientProvider>
    );
    
    // Wait for connection to be established
    await waitFor(() => expect(screen.getByText('Connected to traffic monitor')).toBeInTheDocument(), { timeout: 1000 });
    
    // Simulate WebSocket message
    const testEvent = {
      method: 'GET',
      path: '/api/test',
      status: 200,
      durationMs: 150,
      timestamp: new Date().toISOString()
    };
    
    // when
    await act(async () => {
      // @ts-expect-error - Using the helper function to simulate a message
      stompjs.__simulateMessage(testEvent);
    });
    
    // then
    expect(screen.getByText(testEvent.method)).toBeInTheDocument();
    
    // when
    await user.click(screen.getByRole('button', { name: 'Clear Events' }));
    
    // then
    expect(screen.getByText(/No traffic events recorded yet/)).toBeInTheDocument();
  });

  it('shows authentication required message when there is no token', async () => {
    window.localStorage.getItem = vi.fn(() => null);

    render(
      <QueryClientProvider client={queryClient}>
        <TrafficMonitorPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Authentication required')).toBeInTheDocument();
    });
    expect(SockJS).not.toHaveBeenCalled();
  });

  it('keeps clear button disabled when no events are present', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TrafficMonitorPage />
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText('Connected to traffic monitor')).toBeInTheDocument());

    let clearButton = screen.getByTestId('traffic-clear-button');
    expect(clearButton).toBeDisabled();

    await act(async () => {
      // @ts-expect-error testing helper
      stompjs.__simulateMessage({
        method: 'GET',
        path: '/status',
        status: 200,
        durationMs: 10,
        timestamp: new Date().toISOString(),
      });
    });

    await waitFor(() => expect(screen.getByTestId('traffic-event-0')).toBeInTheDocument());

    clearButton = screen.getByTestId('traffic-clear-button');
    expect(clearButton).not.toBeDisabled();
  });

  it('updates connection badge when STOMP disconnects', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TrafficMonitorPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('traffic-connection-status')).toHaveTextContent('Connected');
    });

    const clients =
      // @ts-expect-error testing helper
      stompjs.__getClients?.() ?? [];
    expect(clients.length).toBeGreaterThan(0);
    const client = clients.at(-1);

    await act(async () => {
      client?.deactivate?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId('traffic-connection-status')).toHaveTextContent('Disconnected');
      expect(screen.getByTestId('traffic-status-message')).toHaveTextContent('Disconnected');
    });
  });

  it('applies status color coding for different HTTP codes', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TrafficMonitorPage />
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText('Connected to traffic monitor')).toBeInTheDocument());

    const events = [
      { status: 201, className: 'text-green-600' },
      { status: 302, className: 'text-blue-600' },
      { status: 404, className: 'text-orange-600' },
      { status: 503, className: 'text-red-600' },
    ];

    for (const event of events) {
      await act(async () => {
        // @ts-expect-error testing helper
        stompjs.__simulateMessage({
          method: 'GET',
          path: `/events/${event.status}`,
          status: event.status,
          durationMs: 5,
          timestamp: new Date().toISOString(),
        });
      });
    }

    await waitFor(() => {
      expect(screen.getByTestId('traffic-event-status-3')).toBeInTheDocument();
    });

    const expectedOrder = [...events].reverse();
    expectedOrder.forEach((event, index) => {
      const cell = screen.getByTestId(`traffic-event-status-${index}`);
      const statusSpan = cell.querySelector('span');
      expect(cell).toHaveTextContent(String(event.status));
      expect(statusSpan).toHaveClass(event.className);
    });
  });
});
