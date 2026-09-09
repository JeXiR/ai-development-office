export interface OfficeSkillEntry {
  id: string;
  name: string;
  category: string;
  sources: Array<"cursor"|"claude"|"kit">;
  paths: string[];
  active: boolean;
  enabled: boolean;
  agentRoles: string[];
  capabilities: string[];
}

export interface ProjectSkillsSnapshot {
  projectId: string;
  generatedAt: string;
  total: number;
  activeCount: number;
  entries: OfficeSkillEntry[];
}
