import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useQuery } from '@tanstack/react-query';
import { getAbsoluteApiUrl, traffic } from '../../lib/api';
import { TrafficEventDto } from '../../types/traffic';
import { Button } from '../../components/ui/button';
import { authStorage } from '../../lib/authStorage';

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
    return <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/84 px-6 py-12 text-center text-slate-500" data-testid="traffic-loading">Loading traffic monitor...</div>;
  }

  if (error) {
    return <div className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-12 text-center text-red-600" data-testid="traffic-error">Error loading traffic monitor: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-6 pb-10" data-testid="traffic-monitor-page">
      <section
        className="rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(244,240,235,0.98))] px-6 py-7 shadow-[0_28px_70px_-55px_rgba(15,23,42,0.45)] md:px-8"
        data-testid="traffic-header"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Observability</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="traffic-title">Traffic Monitor</h1>
          </div>
          <span
            className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium ${
              isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}
            data-testid="traffic-connection-status"
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </section>

      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/84 p-5 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]" data-testid="traffic-status-container">
        <p className="text-slate-700" data-testid="traffic-status-message">{statusMessage}</p>
        <p className="mt-1 text-sm text-slate-500" data-testid="traffic-description">
          {trafficInfo?.data?.description || 'Live HTTP request monitoring'}
        </p>
      </div>

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
        <div className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/84 shadow-[0_28px_70px_-55px_rgba(15,23,42,0.45)]" data-testid="traffic-events-table-container">
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
        </div>
      ) : (
        <div className="rounded-[2rem] border border-stone-200/80 bg-white/84 p-12 text-center text-slate-500 shadow-[0_28px_70px_-55px_rgba(15,23,42,0.45)]" data-testid="traffic-empty-state">
          No traffic events recorded yet. Make some API requests to see them appear here.
        </div>
      )}
    </div>
  );
}
