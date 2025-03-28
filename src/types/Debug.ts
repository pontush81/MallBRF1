export interface DebugInfo {
  error?: string;
  clientInfo?: {
    location: string;
    origin: string;
    hostname: string;
    environment: string;
  };
} 