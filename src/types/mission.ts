export type AuditCadence = "off" | "daily" | "weekly";

export type OfficeThemeId =
  | "classic-cc0"
  | "pixel-office-32"
  | "luxury-office"
  | "modern-corporate"
  | "call-center"
  | "top-down-corporate"
  | "office-hell";

export interface ScheduledAudit {
  id: string;
  projectId: string;
  label: string;
  command: string;
  cadence: AuditCadence;
  enabled: boolean;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
}

export interface OfficeMissionSettings {
  scheduledAudits: ScheduledAudit[];
  officeTheme: OfficeThemeId;
  usageTelemetry: {
    tokenSource: "unavailable" | "provider";
    costSource: "unavailable" | "provider";
  };
}

export interface TaskExecutionReport {
  id: string;
  projectId: string;
  workItemId?: string | null;
  findingId?: string | null;
  title: string;
  command: string;
  provider?: string | null;
  assignedRole?: string | null;
  executionLane?: string | null;
  sprintId?: string | null;
  dependencies: string[];
  planPath?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  runnerExitOk: boolean;
  qualityGateStatus: string;
  resultSummary: string;
  leadRole?: string | null;
  collaboratorRoles?: string[];
  collaboratorCodingRoles?: string[];
  verifierStatus?: string;
  verifierReportPath?: string | null;
  driftStatus?: string;
  driftSummary?: string | null;
  collaboratorStatus?: Record<string,string>;
  collaboratorReportPaths?: Record<string,string>;
  collaboratorSummary?: string | null;
  executionMode?: "solo" | "collaborative" | "competitive";
  isolationStatus?: string;
  worktreePaths?: Record<string,string>;
  mergeGateStatus?: string;
  mergeGateSummary?: string | null;
  conflictFiles?: string[];
  competitiveWinner?: "cursor" | "claude" | null;
  competitiveSummary?: string | null;
  usage?: {
    inputTokens: number | null;
    outputTokens: number | null;
    costUsd: number | null;
    source: "unavailable" | "provider";
  };
}


export interface OfficeAuditEntry {
  id:string; timestamp:string; projectId?:string|null; actor:string; action:string;
  subject?:string|null; outcome:"info"|"success"|"blocked"|"error"; message:string;
}
export interface OfficeRecoverySnapshot {
  generatedAt:string;
  interrupted:Array<{id:string;projectId:string;title:string;status:string;message?:string|null}>;
  staleWorktrees:Array<{projectId:string;commandId:string;path:string}>;
  rollbackRisks:Array<{id:string;projectId:string;summary:string}>;
}
export interface OfficeReleaseGate {
  projectId:string; generatedAt:string; ready:boolean;
  checks:Array<{id:string;label:string;ok:boolean;value:string}>;
}
export interface OfficeDoctorSnapshot {
  projectId:string; generatedAt:string; overall:"healthy"|"warning"|"critical";
  checks:Array<{id:string;label:string;status:"pass"|"warn"|"fail";detail:string}>;
}
export interface OfficeRetentionSettings { reportsDays:number; auditDays:number; worktreeDays:number; }


export interface OfficeBackupResult {
  generatedAt:string;
  path:string;
  projects:number;
  commands:number;
  auditEntries:number;
}
export interface OfficeReleaseActionResult {
  projectId:string;
  action:"branch"|"commit"|"pr"|"leave_uncommitted";
  ok:boolean;
  message:string;
  branch?:string|null;
  output?:string|null;
}
