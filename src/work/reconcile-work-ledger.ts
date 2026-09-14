export const IN_FLIGHT_COMMAND_STATUSES = [
  "queued",
  "waiting_for_agent",
  "planning",
  "plan_ready",
  "running",
  "verifying"
] as const;

export const TERMINAL_WORK_STATUSES = ["done", "fixed", "cancelled", "failed"] as const;

export function isInFlightCommandStatus(status: unknown) {
  return (IN_FLIGHT_COMMAND_STATUSES as readonly string[]).includes(String(status || ""));
}

export function isTerminalWorkStatus(status: unknown) {
  return (TERMINAL_WORK_STATUSES as readonly string[]).includes(String(status || ""));
}

type RelatedCommand = {
  id?: string | null;
  projectId?: string;
  workItemId?: string | null;
  findingId?: string | null;
  status?: string | null;
  message?: string | null;
  qualityGateStatus?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
};

function commandStamp(command: RelatedCommand) {
  const raw = command.updatedAt || command.completedAt || command.createdAt || "";
  const n = Date.parse(String(raw));
  return Number.isFinite(n) ? n : 0;
}

export function pickLatestRelatedCommand<T extends RelatedCommand>(
  commands: T[],
  projectId: string,
  workItemId: string
) {
  const id = String(workItemId || "");
  if (!id) return null;
  const related = commands.filter((command) => {
    if (!command || String(command.projectId || "") !== projectId) return false;
    const wid = String(command.workItemId || "");
    const fid = String(command.findingId || "");
    return (wid && wid === id) || (fid && id.includes(fid));
  });
  if (!related.length) return null;
  return related.slice().sort((a, b) => commandStamp(b) - commandStamp(a))[0];
}

export function shouldKeepVanishedWorkItem(
  previous: { status?: string | null },
  related: { status?: string | null } | null | undefined
) {
  if (isTerminalWorkStatus(previous.status)) return false;
  return isInFlightCommandStatus(related?.status);
}
