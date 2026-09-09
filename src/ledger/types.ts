export type LedgerEntry={
  id:string;
  projectId:string;
  provider:string;
  agentId:string;
  taskId:string|null;
  sessionId:string|null;
  inputTokens:number;
  outputTokens:number;
  totalTokens:number;
  estimatedCostUsd:number;
  latencyMs:number|null;
  durationMs:number|null;
  createdAt:string;
};

export type LedgerSummary={
  entries:number;
  totalTokens:number;
  totalCostUsd:number;
  byProvider:Record<string,{entries:number;tokens:number;costUsd:number;avgLatencyMs:number|null}>;
};
