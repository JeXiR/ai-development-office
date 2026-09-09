import type { AgentStatus } from "@/types/office";

export function StatusBadge({ status }: { status: AgentStatus }) {
  return <span className={`status status-${status}`}>{status}</span>;
}
