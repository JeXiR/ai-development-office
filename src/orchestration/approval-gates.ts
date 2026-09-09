export type ApprovalRisk="safe"|"guarded"|"high";

export type ApprovalDecision={
  required:boolean;
  risk:ApprovalRisk;
  reasons:string[];
};

const HIGH_PATTERNS=[
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+push\b.*--force\b/i,
  /\bdrop\s+database\b/i,
  /\btruncate\b/i,
  /\bnpm\s+publish\b/i,
  /\bproduction\b.*\bdeploy\b/i,
  /\brm\s+-rf\b/i
];

const GUARDED_PATTERNS=[
  /\bgit\s+push\b/i,
  /\bdeploy\b/i,
  /\bmigrate\b/i,
  /\bdelete\b/i,
  /\bexternal\b.*\bwrite\b/i,
  /\bcredential\b/i,
  /\bsecret\b/i
];

export function classifyApprovalNeed(text:string):ApprovalDecision{
  const reasons:string[]=[];
  for(const pattern of HIGH_PATTERNS){
    if(pattern.test(text))reasons.push(`high-risk pattern: ${pattern}`);
  }
  if(reasons.length)return {required:true,risk:"high",reasons};

  for(const pattern of GUARDED_PATTERNS){
    if(pattern.test(text))reasons.push(`guarded pattern: ${pattern}`);
  }
  if(reasons.length)return {required:true,risk:"guarded",reasons};

  return {required:false,risk:"safe",reasons:[]};
}
