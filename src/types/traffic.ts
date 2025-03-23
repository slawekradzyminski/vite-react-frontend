export interface TrafficEventDto {
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