import type {ReleaseEvidenceBundle,ReleaseEvidenceItem} from "./evidence-types";

export type StablePromotionInput={
  version:string;
  typecheck:boolean|null;
  build:boolean|null;
  betaGate:boolean|null;
  rc1Gate:boolean|null;
  rc2Gate:boolean|null;
  callMeValidation:boolean|null;
  npmAuditReviewed:boolean|null;
  securityManualReview:boolean|null;
  packagingVerified:boolean|null;
};

function item(
  id:string,
  category:ReleaseEvidenceItem["category"],
  value:boolean|null,
  message:string
):ReleaseEvidenceItem{
  return {
    id,category,
    status:value===true?"pass":value===false?"fail":"pending",
    message
  };
}

export function buildReleaseEvidence(input:StablePromotionInput):ReleaseEvidenceBundle{
  const items:ReleaseEvidenceItem[]=[
    item("typecheck","build",input.typecheck,"TypeScript typecheck"),
    item("production-build","build",input.build,"Production build"),
    item("beta-gate","integration",input.betaGate,"Unified beta gate"),
    item("rc1-gate","security",input.rc1Gate,"RC1 security/recovery gate"),
    item("rc2-gate","packaging",input.rc2Gate,"RC2 final acceptance gate"),
    item("callme-real","integration",input.callMeValidation,"Real CallMe validation"),
    item("npm-audit-review","security",input.npmAuditReviewed,"npm audit findings reviewed"),
    item("security-manual","manual",input.securityManualReview,"Manual credential/approval/recovery review"),
    item("package-integrity","packaging",input.packagingVerified,"Release package integrity")
  ];

  const blockingFailures=items.filter(x=>x.status==="fail").length;
  const pendingItems=items.filter(x=>x.status==="pending").length;

  return {
    version:input.version,
    channel:"rc",
    createdAt:new Date().toISOString(),
    projectValidation:input.callMeValidation===true?"pass":input.callMeValidation===false?"fail":"pending",
    npmAudit:input.npmAuditReviewed===true?"pass":input.npmAuditReviewed===false?"findings":"pending",
    items,
    blockingFailures,
    pendingItems,
    stableEligible:blockingFailures===0&&pendingItems===0
  };
}
