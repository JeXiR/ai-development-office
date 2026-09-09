export type ReleaseEvidenceItem={
  id:string;
  category:"build"|"test"|"security"|"integration"|"packaging"|"manual";
  status:"pass"|"fail"|"pending"|"warning";
  message:string;
  evidence?:unknown;
};

export type ReleaseEvidenceBundle={
  version:string;
  channel:"rc"|"stable";
  createdAt:string;
  projectValidation:"pending"|"pass"|"fail";
  npmAudit:"pending"|"pass"|"findings";
  items:ReleaseEvidenceItem[];
  blockingFailures:number;
  pendingItems:number;
  stableEligible:boolean;
};
