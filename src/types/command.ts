export type OfficeCommandName =
  | "status"
  | "sync state"
  | "review project"
  | "fix next"
  | "validate"
  | "continue"
  | "check project readiness"
  | "fix finding"
  | "execute work item"
  | string;

export type OfficeCommandStatus =
  | "queued"
  | "planning"
  | "plan_ready"
  | "waiting_for_agent"
  | "running"
  | "verifying"
  | "completed"
  | "failed"
  | "cancelled";

export interface OfficeCommandRequest {
  id: string;
  projectId: string;
  projectPath: string;
  command: OfficeCommandName;
  status: OfficeCommandStatus;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  provider?: string | null;
  message?: string | null;

  findingId?: string | null;
  findingTitle?: string | null;

  workItemId?: string | null;
  workItemTitle?: string | null;
  workItemType?: string | null;

  assignedRole?: string | null;
  queueGroupId?: string | null;
  queueSequence?: number | null;
  attempt?: number | null;

  requiresPlan?: boolean;
  planPath?: string | null;
  planSummary?: string | null;
  plannedAt?: string | null;
  executionLane?: string | null;
  sprintId?: string | null;
  sprintLabel?: string | null;
  dependencyIds?: string[];
  blockedBy?: string[];
  qualityGateStatus?: "not_required" | "pending" | "execution_passed" | "pending_reaudit" | "verified" | "failed";
  taskReportPath?: string | null;
  leadRole?: string | null;
  collaboratorRoles?: string[];
  collaboratorCodingRoles?: string[];
  verifierStatus?: "not_required" | "pending" | "passed" | "failed" | "error";
  verifierReportPath?: string | null;
  driftStatus?: "not_checked" | "clean" | "detected";
  driftSummary?: string | null;
  collaboratorStatus?: Record<string, "pending" | "passed" | "blocked" | "error">;
  collaboratorReportPaths?: Record<string,string>;
  collaboratorSummary?: string | null;
  executionMode?: "solo" | "collaborative" | "competitive";
  isolationStatus?: "not_required" | "pending" | "ready" | "failed";
  worktreePaths?: Record<string,string>;
  mergeGateStatus?: "not_required" | "pending" | "passed" | "blocked" | "applied" | "failed";
  mergeMethod?: "none" | "squash" | "patch" | "mixed";
  mergeGateSummary?: string | null;
  conflictFiles?: string[];
  competitiveWinner?: "cursor" | "claude" | null;
  competitiveSummary?: string | null;
  subtaskContractPath?: string | null;
  ownedFiles?: string[];
  ownershipStatus?: "not_required" | "ready" | "conflict" | "failed";
  ownershipConflicts?: string[];
  recoveryState?: "none" | "recoverable" | "recovered" | "discarded";
  inboxDismissed?: boolean;
}
