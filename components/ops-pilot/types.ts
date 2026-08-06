export type WorkspaceTab = "chat" | "metrics" | "security" | "diagnostics";

export interface Telemetry {
  cpu: number;
  memory: number;
  networkIn: number;
  networkOut: number;
}

export interface OperationsSnapshot {
  cpu: number;
  memory: number;
  latency: number;
  uptime: string;
  errorRate: number;
}

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  operationsData?: OperationsSnapshot;
}
