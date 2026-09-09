export type IntegrationActionStatus="success"|"failed"|"retrying";
export type IntegrationActionRequest={
  integrationId:string; action:string; projectId:string; actor:string;
  payload:Record<string,unknown>; idempotencyKey:string|null;
};
export type IntegrationActionResult={
  ok:boolean; status:number|null; data:unknown; message:string; attempt:number; durationMs:number;
};
export type IntegrationAuditEntry={
  id:string; projectId:string; integrationId:string; action:string; actor:string;
  status:IntegrationActionStatus; attempt:number; durationMs:number; message:string;
  createdAt:string; payloadSummary:Record<string,unknown>;
};
export type IntegrationRetryPolicy={
  maxAttempts:number; baseDelayMs:number; maxDelayMs:number; retryStatuses:number[];
};
export type IntegrationWatch={
  id:string; projectId:string; integrationId:string;
  kind:"ci-status"|"sentry-issue"|"webhook";
  resource:string; enabled:boolean; intervalMinutes:number;
  lastCheckedAt:string|null; lastState:string|null; createdAt:string;
};
