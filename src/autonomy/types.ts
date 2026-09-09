export type AgentQualityScore={
  agentId:string;
  role:string;
  completed:number;
  failed:number;
  retries:number;
  avgDurationMs:number|null;
  avgCostUsd:number|null;
  quality:number;
  trust:number;
  specialties:string[];
  updatedAt:string;
};

export type TeamRole={
  id:string;
  title:string;
  capabilities:string[];
  preferredProviders:string[];
  maxCostUsd:number|null;
};

export type DynamicTeam={
  id:string;
  projectId:string;
  goal:string;
  roles:TeamRole[];
  createdAt:string;
};

export type RetryStrategy={
  action:"retry_same"|"retry_fallback"|"constrain"|"stop"|"request_human";
  delaySeconds:number;
  provider:string|null;
  reason:string;
};

export type RecoveryDecision={
  action:"continue"|"steer"|"retry"|"fallback"|"pause"|"stop";
  reason:string;
  nextProvider:string|null;
  steerMessage:string|null;
};

export type RoutingBudget={
  maxCostUsd:number|null;
  preferredProviders:string[];
  avoidProviders:string[];
  minTrust:number;
};
