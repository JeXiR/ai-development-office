export type ApprovalDecision="pending"|"approved"|"rejected"|"expired";
export type RiskLevel="low"|"medium"|"high"|"critical";
export type ApprovalRequest={id:string;projectId:string;actor:string;action:string;reason:string;risk:RiskLevel;resource:string|null;command:string|null;createdAt:string;expiresAt:string|null;decision:ApprovalDecision;decidedAt:string|null;decidedBy:string|null;};
export type PermissionPolicy={network:"deny"|"ask"|"allow";providerExecution:"deny"|"ask"|"allow";terminalWrite:"deny"|"ask"|"allow";terminalTerminate:"deny"|"ask"|"allow";filesystemWrite:"deny"|"ask"|"allow";};
export type SandboxProfile={id:string;label:string;allowNetwork:boolean;allowShell:boolean;allowGitWrite:boolean;allowFileWrite:boolean;protectedPaths:string[];maxRuntimeMinutes:number;maxTokens:number;maxCostUsd:number;};
export type CommandRisk={level:RiskLevel;destructive:boolean;reasons:string[];};
export type AuthorizationResult={allowed:boolean;requiresApproval:boolean;reason:string;approvalId:string|null;};
