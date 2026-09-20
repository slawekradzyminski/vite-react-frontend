export interface ProtocolDetails {
  protocol: 'GRAPHQL' | 'GRPC';
  operation: string;
  outcome: 'SUCCESS' | 'PARTIAL_ERROR' | 'ERROR';
  codes: string[];
  correlationId: string;
}

export interface TrafficEventDto {
  protocolDetails?: ProtocolDetails;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: string;
}

export interface TrafficInfoDto {
  webSocketEndpoint: string;
  topic: string;
  description: string;
} 