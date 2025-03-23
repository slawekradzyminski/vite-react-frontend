import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrafficMonitorPage } from './index';
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
  
  return {
    Client: vi.fn().mockImplementation((config) => new MockClient(config)),
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
});