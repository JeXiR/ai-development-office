export type WorkItemType =
  | "security"
  | "frontend"
  | "backend"
  | "test"
  | "docs"
  | "devops"
  | "database"
  | "feature"
  | "refactor"
  | "decision";

export type WorkItemStatus =
  | "todo"
  | "queued"
  | "working"
  | "done"
  | "deferred"
  | "blocked";

export type WorkPriority = "critical" | "high" | "medium" | "low" | "info";

export interface OfficeWorkItem {
  id: string;
  projectId: string;
  type: WorkItemType;
  title: string;
  description?: string | null;
  status: WorkItemStatus;
  priority: WorkPriority;
  source:
    | "security-audit"
    | "canonical-backlog"
    | "progress"
    | "roadmap"
    | "todo"
    | "test-gaps"
    | "frontend-audit"
    | "project-state"
    | "coverage"
    | "feature-contract"
    | "manual";
  sourceFile?: string | null;
  sourceLine?: number | null;
  assignedRole?: string | null;
  evidence?: string[];
  acceptanceCriteria?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  commandId?: string | null;
  deferredReason?: string | null;
  lastSeenAt?: string | null;
  resolvedAt?: string | null;
  resolutionEvidence?: string[];
  verificationStatus?: "unverified" | "pending_reaudit" | "verified" | "failed";
  dependencyIds?: string[];
  blockedBy?: string[];
  leadRole?: string;
  collaboratorRoles?: string[];
  collaboratorCodingRoles?: string[];
  executionMode?: "solo" | "collaborative" | "competitive";
}

export interface FrontendCoverageItem {
  id: string;
  label: string;
  status: "verified" | "partial" | "missing" | "unknown";
  evidence: string[];
  gaps: string[];
}

export interface ProjectWorkbenchState {
  projectId: string;
  generatedAt: string;
  workItems: OfficeWorkItem[];
  frontendCoverage: FrontendCoverageItem[];
  summary: {
    todo: number;
    fixing: number;
    done: number;
    deferred: number;
    frontendVerified: number;
    frontendPartial: number;
    frontendMissing: number;
    frontendUnknown: number;
  };
}
