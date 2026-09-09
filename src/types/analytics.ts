export interface AgentAnalyticsRow {
  agentId: string;
  role: string;
  assigned: number;
  completed: number;
  failed: number;
  infrastructureBlocked?: number;
  cancelled: number;
  active: number;
  queued: number;
  successRate: number | null;
  avgDurationSeconds: number | null;
}

export interface OfficeAgentAnalytics {
  projectId: string;
  generatedAt: string;
  rows: AgentAnalyticsRow[];
  totalCommands: number;
  totalCompleted: number;
  totalFailed: number;
  totalInfrastructureBlocked?: number;
  parallelPeak: number;
}
