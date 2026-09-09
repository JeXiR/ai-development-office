export type GovernanceRole=
  |"owner"
  |"maintainer"
  |"reviewer"
  |"operator"
  |"auditor";

export type GovernanceDecisionStatus="proposed"|"approved"|"rejected"|"superseded";
export type GovernanceWaiverStatus="active"|"expired"|"revoked";

export type GovernancePolicy={
  version:number;
  projectId:string;
  requiredApprovals:{
    destructiveAction:number;
    release:number;
    policyChange:number;
    waiver:number;
  };
  allowedRoles:Record<string,GovernanceRole[]>;
  evidenceRetentionDays:number;
  auditRetentionDays:number;
  requireReleaseEvidence:boolean;
  requireNoCriticalWaivers:boolean;
  requireStableGateUnlocked:boolean;
  updatedAt:string;
  updatedBy:string;
};

export type GovernanceMember={
  id:string;
  displayName:string;
  role:GovernanceRole;
  active:boolean;
  addedAt:string;
};

export type GovernanceDecision={
  id:string;
  projectId:string;
  title:string;
  rationale:string;
  status:GovernanceDecisionStatus;
  proposedBy:string;
  approvedBy:string[];
  rejectedBy:string[];
  createdAt:string;
  updatedAt:string;
  supersedes:string|null;
  evidenceIds:string[];
};

export type GovernanceWaiver={
  id:string;
  projectId:string;
  policyKey:string;
  reason:string;
  severity:"low"|"medium"|"high"|"critical";
  status:GovernanceWaiverStatus;
  requestedBy:string;
  approvedBy:string[];
  createdAt:string;
  expiresAt:string|null;
  revokedAt:string|null;
};

export type GovernanceEvidence={
  id:string;
  projectId:string;
  type:"test"|"build"|"runtime"|"security"|"review"|"manual"|"artifact";
  label:string;
  status:"pass"|"fail"|"unknown";
  source:string;
  sha256:string|null;
  createdAt:string;
  metadata:Record<string,unknown>;
};

export type ReleaseSignoff={
  id:string;
  projectId:string;
  version:string;
  requestedBy:string;
  requiredApprovals:number;
  approvals:Array<{memberId:string;at:string}>;
  evidenceIds:string[];
  blockers:string[];
  status:"pending"|"approved"|"rejected";
  createdAt:string;
  updatedAt:string;
};
