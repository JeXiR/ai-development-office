export type FeatureArchetype =
  | "managed-resource" | "api-resource" | "read-only-resource" | "workflow-resource"
  | "dashboard" | "settings-module" | "reporting-module" | "file-management"
  | "authentication-flow" | "webhook-integration" | "billing-resource"
  | "queue-job" | "notification-channel" | "unknown";

export type ExpectationLevel = "required" | "assumed" | "decision_required" | "excluded";
export type FeatureSurfaceStatus = "verified" | "partial" | "missing" | "unknown" | "deferred";

export interface FeatureSurfaceExpectation {
  key: string; label: string; level: ExpectationLevel; status: FeatureSurfaceStatus;
  evidence: string[]; gaps: string[];
}
export interface FeatureDecisionQuestion {
  id: string; featureId: string; question: string; options: string[];
  answer?: string | null; status: "open" | "answered";
}
export interface FeatureContract {
  id: string; name: string; archetype: FeatureArchetype; source: string[];
  confidence: "high" | "medium" | "low";
  surface: FeatureSurfaceExpectation[]; questions: FeatureDecisionQuestion[]; updatedAt: string;
}
export interface FeatureContractsState {
  projectId: string; generatedAt: string; contracts: FeatureContract[]; openQuestions: number;
}
