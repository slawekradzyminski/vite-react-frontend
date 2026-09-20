import type { TrafficEventDto } from '../types/traffic';

export function trafficPresentation(event: TrafficEventDto) {
  const details = event.protocolDetails;
  if (details) {
    const success = details.outcome === 'SUCCESS';
    const outcome = success ? 'Success' : details.outcome === 'PARTIAL_ERROR' ? 'Partial error' : 'Error';
    return {
      protocol: details.protocol === 'GRAPHQL' ? 'GraphQL' : 'gRPC',
      status: details.protocol === 'GRAPHQL'
        ? `${outcome} · HTTP ${event.status}`
        : `${details.codes.join(', ')} (${event.status})`,
      color: success ? 'text-emerald-600' : 'text-red-600',
      operation: details.operation,
      correlationId: details.correlationId,
    };
  }
  return {
    protocol: 'REST',
    status: String(event.status),
    color: event.status >= 200 && event.status < 300 ? 'text-emerald-600'
      : event.status >= 300 && event.status < 400 ? 'text-sky-600'
        : event.status >= 400 && event.status < 500 ? 'text-orange-600'
          : event.status >= 500 ? 'text-red-600' : '',
    operation: '',
    correlationId: '',
  };
}
