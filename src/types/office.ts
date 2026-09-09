export type AgentStatus =
  | "idle" | "reading" | "planning" | "working" | "reviewing"
  | "testing" | "waiting" | "blocked" | "done" | "error";

export type CoreOfficeRole =
  | "CEO" | "CTO" | "PM" | "Architect" | "Docs" | "DevOps" | "QA" | "Security";

export type OfficeRole = CoreOfficeRole | string;

export type AgentKind = "core" | "specialist";
export type AgentScope = "active" | "candidate" | "disabled";

export type RunnerProvider = "auto" | "cursor" | "claude";

export interface OfficeAgent {
  id: string;
  role: OfficeRole;
  status: AgentStatus;
  task?: string | null;
  skill?: string | null;
  file?: string | null;
  displayName?: string | null;
  kind?: AgentKind;
  scope?: AgentScope;
  capabilities?: string[];
  source?: string[];
  homeRoom?: "ceo" | "conference" | "engineering" | "quality" | "ops" | "knowledge";
  progressPercent?: number | null;
  queueCount?: number;
  sprintTotal?: number;
  sprintCompleted?: number;
}

export interface OfficeFinding {
  id: string;
  severity: "BLOCKER" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  status: "open" | "working" | "fixed" | "deferred";
  firstSeenAt?: string | null;
  updatedAt?: string | null;
  fixedAt?: string | null;
  assignedRole?: string | null;
  lastResult?: string | null;
}

export interface OfficeState {
  projectId: string;
  projectName: string;
  projectPath?: string;
  milestone?: string | null;
  activeTask?: string | null;
  health: "unknown" | "healthy" | "warning" | "critical";
  roadmapPercent?: number | null;
  counts: { done:number; partial:number; todo:number; bugs:number; blockers:number };
  agents: OfficeAgent[];
  findings: OfficeFinding[];
}

export interface OfficeProject {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  provider?: RunnerProvider;
  runnerTrusted?: boolean;
}

export interface RunnerProviderStatus {
  available: boolean;
  executable?: string | null;
  version?: string | null;
  message?: string | null;
}

export interface RunnerStatus {
  available: boolean;
  selectedProvider: RunnerProvider;
  activeProvider?: "cursor" | "claude" | null;
  runningCommandId?: string | null;
  parallel?: {
    max:number;
    active:number;
    lanes:Array<{lane:string;commandId:string;provider:"cursor"|"claude"|null}>;
  };
  providers: {
    cursor: RunnerProviderStatus;
    claude: RunnerProviderStatus;
  };
}

export interface OfficeEvent {
  event_id: string;
  timestamp: string;
  project_id: string;
  event_type:
    | "command" | "task_started" | "task_progress" | "task_completed"
    | "finding" | "decision_required" | "waiting" | "blocked"
    | "error" | "validation" | "file_activity" | "handoff";
  status: AgentStatus;
  actor: { id:string; role:string; provider?:string|null; skill?:string|null };
  task?: string | null;
  file?: string | null;
  message?: string | null;
  severity?: string | null;
  progress_percent?: number | null;
}
