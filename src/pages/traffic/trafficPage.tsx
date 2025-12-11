import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useQuery } from '@tanstack/react-query';
import api, { traffic } from '../../lib/api';
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

  // Fetch traffic info (WebSocket endpoint and topic)
  const { data: trafficInfo, isLoading, error } = useQuery({
    queryKey: ['trafficInfo'],
    queryFn: () => traffic.getInfo()
  });

  // Initialize WebSocket connection when traffic info is available
  useEffect(() => {
    if (!trafficInfo?.data) return;

    const { webSocketEndpoint, topic } = trafficInfo.data;
    const token = authStorage.getAccessToken();
    if (!token) return;

    const fullUrl = `${api.defaults.baseURL}${webSocketEndpoint}`;
    
    // Create SockJS connection
    const socket = new SockJS(fullUrl);
    
    // Initialize STOMP client
    const stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (str) => console.log('STOMP debug:', str),
      onConnect: () => {
        setIsConnected(true);
        setStatusMessage('Connected to traffic monitor');
        
        // Subscribe to traffic events
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
                // Ignore events that were generated before the last clear action.
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
    
    // Connect the client
    stompClient.activate();
    stompClientRef.current = stompClient;
    
    // Clean up on unmount
    return () => {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.deactivate();
      }
    };
  }, [trafficInfo?.data]);

  // Clear events handler
  const handleClearEvents = () => {
    // Mark the current time so late-arriving events from before the clear do not reappear.
    lastClearedAtRef.current = Date.now();
    setTrafficEvents([]);
  };

  // Format event status with color
  const formatStatus = (status: number) => {
    let colorClass = '';
    if (status >= 200 && status < 300) colorClass = 'text-green-600';
    else if (status >= 300 && status < 400) colorClass = 'text-blue-600';
    else if (status >= 400 && status < 500) colorClass = 'text-orange-600';
    else if (status >= 500) colorClass = 'text-red-600';
    
    return <span className={colorClass}>{status}</span>;
  };

  if (isLoading) {
    return <div className="p-8 text-center" data-testid="traffic-loading">Loading traffic monitor...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600" data-testid="traffic-error">Error loading traffic monitor: {(error as Error).message}</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl" data-testid="traffic-monitor-page">
      <div className="flex justify-between items-center mb-6" data-testid="traffic-header">
        <h1 className="text-2xl font-bold" data-testid="traffic-title">Traffic Monitor</h1>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
          data-testid="traffic-connection-status"
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md mb-6" data-testid="traffic-status-container">
        <p className="text-gray-700" data-testid="traffic-status-message">{statusMessage}</p>
        <p className="text-sm text-gray-500 mt-1" data-testid="traffic-description">
          {trafficInfo?.data?.description || 'Live HTTP request monitoring'}
        </p>
      </div>
      
      <div className="flex justify-between items-center mb-4" data-testid="traffic-events-header">
        <h2 className="text-lg font-semibold" data-testid="traffic-events-title">Recent Traffic Events</h2>
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
        <div className="border rounded-md overflow-hidden" data-testid="traffic-events-table-container">
          <table className="min-w-full divide-y divide-gray-200" data-testid="traffic-events-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trafficEvents.map((event, index) => (
                <tr key={index} className="hover:bg-gray-50" data-testid={`traffic-event-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap" data-testid={`traffic-event-method-${index}`}>
                    <span className="font-mono">{event.method}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900 truncate max-w-xs" data-testid={`traffic-event-path-${index}`}>
                    {event.path}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-testid={`traffic-event-status-${index}`}>
                    {formatStatus(event.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`traffic-event-duration-${index}`}>
                    {event.durationMs}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`traffic-event-time-${index}`}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border rounded-md p-12 text-center text-gray-500" data-testid="traffic-empty-state">
          No traffic events recorded yet. Make some API requests to see them appear here.
        </div>
      )}
    </div>
  );
} 
