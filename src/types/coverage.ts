export type CoverageStatus = "verified" | "partial" | "missing" | "unknown" | "deferred";
export type CoverageConfidence = "high" | "medium" | "low";
export type CoverageDomain = "backend" | "frontend" | "security" | "tests" | "database" | "docs" | "devops" | "ai-integrations";
export type CoverageDomainId = CoverageDomain | "flutter";

export interface CoverageCheck {
  id: string;
  label: string;
  status: CoverageStatus;
  weight: number;
  evidence: string[];
  gaps: string[];
}
export interface CoverageDomainReport {
  domain: CoverageDomainId;
  score: number;
  confidence: CoverageConfidence;
  verified: number; partial: number; missing: number; unknown: number; deferred: number;
  checks: CoverageCheck[];
  largestGaps: string[];
  applicable?: boolean;
}
export interface ProjectCoverageReport {
  projectId: string;
  generatedAt: string;
  overallScore: number;
  overallConfidence: CoverageConfidence;
  unknownCount: number;
  weights: Record<CoverageDomain, number>;
  domains: Record<CoverageDomain, CoverageDomainReport>;
  extras?: CoverageDomainReport[];
  hasProgressDoc?: boolean;
  backlogPercent?: number | null;
  remainingPercent?: number | null;
}
