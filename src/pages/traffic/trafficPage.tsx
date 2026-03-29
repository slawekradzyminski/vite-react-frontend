import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useQuery } from '@tanstack/react-query';
import { getAbsoluteApiUrl, traffic } from '../../lib/api';
import { TrafficEventDto } from '../../types/traffic';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { authStorage } from '../../lib/authStorage';
import { Surface } from '../../components/ui/surface';

export function TrafficMonitorPage() {
  const [trafficEvents, setTrafficEvents] = useState<TrafficEventDto[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState(() => {
    if (!authStorage.getAccessToken()) {
      return 'Authentication required';
    }
    return 'Disconnected';
  });
  const stompClientRef = useRef<Client | null>(null);
  const lastClearedAtRef = useRef<number>(0);

  const { data: trafficInfo, isLoading, error } = useQuery({
    queryKey: ['trafficInfo'],
    queryFn: () => traffic.getInfo()
  });

  useEffect(() => {
    if (!trafficInfo?.data) return;

    const { webSocketEndpoint, topic } = trafficInfo.data;
    const token = authStorage.getAccessToken();
    if (!token) return;

    const fullUrl = getAbsoluteApiUrl(webSocketEndpoint);
    const socket = new SockJS(fullUrl);

    const stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (str) => console.log('STOMP debug:', str),
      onConnect: () => {
        setIsConnected(true);
        setStatusMessage('Connected to traffic monitor');

        stompClient.subscribe(topic, (message) => {
          try {
            const event: TrafficEventDto = JSON.parse(message.body);
            const eventTimestamp = event.timestamp ? Date.parse(event.timestamp) : null;
            setTrafficEvents((prev) => {
              if (
                eventTimestamp !== null &&
                Number.isFinite(eventTimestamp) &&
                eventTimestamp <= lastClearedAtRef.current
              ) {
                return prev;
              }
              return [event, ...prev];
            });
          } catch (err) {
            console.error('Failed to parse traffic event', err);
          }
        });
      },
      onStompError: (frame) => {
        setStatusMessage(`STOMP error: ${frame.body}`);
        setIsConnected(false);
      },
      onDisconnect: () => {
        setIsConnected(false);
        setStatusMessage('Disconnected');
      }
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.deactivate();
      }
    };
  }, [trafficInfo?.data]);

  const handleClearEvents = () => {
    lastClearedAtRef.current = Date.now();
    setTrafficEvents([]);
  };

  const formatStatus = (status: number) => {
    let colorClass = '';
    if (status >= 200 && status < 300) colorClass = 'text-emerald-600';
    else if (status >= 300 && status < 400) colorClass = 'text-sky-600';
    else if (status >= 400 && status < 500) colorClass = 'text-orange-600';
    else if (status >= 500) colorClass = 'text-red-600';

    return <span className={colorClass}>{status}</span>;
  };

  if (isLoading) {
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="traffic-loading">Loading traffic monitor...</Surface>;
  }

  if (error) {
    return <Surface variant="danger" padding="message" className="text-center text-red-600" data-testid="traffic-error">Error loading traffic monitor: {(error as Error).message}</Surface>;
  }

  return (
    <div className="space-y-6 pb-10" data-testid="traffic-monitor-page">
      <Surface
        as="section"
        variant="hero"
        padding="xl"
        data-testid="traffic-header"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Observability</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="traffic-title">Traffic Monitor</h1>
          </div>
          <Badge
            variant={isConnected ? 'success' : 'error'}
            className="w-fit font-medium"
            data-testid="traffic-connection-status"
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </Surface>

      <Surface variant="muted" padding="md" data-testid="traffic-status-container">
        <p className="text-slate-700" data-testid="traffic-status-message">{statusMessage}</p>
        <p className="mt-1 text-sm text-slate-500" data-testid="traffic-description">
          {trafficInfo?.data?.description || 'Live HTTP request monitoring'}
        </p>
      </Surface>

      <div className="mb-4 flex justify-between items-center" data-testid="traffic-events-header">
        <h2 className="text-lg font-semibold text-slate-950" data-testid="traffic-events-title">Recent Traffic Events</h2>
        <Button
          variant="outline"
          onClick={handleClearEvents}
          disabled={trafficEvents.length === 0}
          data-testid="traffic-clear-button"
        >
          Clear Events
        </Button>
      </div>

      {trafficEvents.length > 0 ? (
        <Surface variant="default" className="overflow-hidden" data-testid="traffic-events-table-container">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200" data-testid="traffic-events-table">
              <thead className="bg-stone-50/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white/60">
                {trafficEvents.map((event, index) => (
                  <tr key={index} className="hover:bg-stone-50/70" data-testid={`traffic-event-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap" data-testid={`traffic-event-method-${index}`}>
                      <span className="font-mono text-slate-900">{event.method}</span>
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 whitespace-nowrap font-mono text-sm text-slate-900" data-testid={`traffic-event-path-${index}`}>
                      {event.path}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-testid={`traffic-event-status-${index}`}>
                      {formatStatus(event.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" data-testid={`traffic-event-duration-${index}`}>
                      {event.durationMs}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" data-testid={`traffic-event-time-${index}`}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      ) : (
        <Surface variant="default" className="p-12 text-center text-slate-500" data-testid="traffic-empty-state">
          No traffic events recorded yet. Make some API requests to see them appear here.
        </Surface>
      )}
    </div>
  );
}
