export type OperationRisk="safe"|"guarded"|"high"|"blocked";

export type OperationPolicyDecision={
  risk:OperationRisk;
  approvalRequired:boolean;
  blocked:boolean;
  reasons:string[];
};

const BLOCKED=[
  /\bformat\b/i,
  /\bmkfs\b/i,
  /\bshutdown\b/i,
  /\brm\s+-rf\s+\/\b/i,
  /\bdel\s+\/s\s+\/q\s+[a-z]:\\/i
];

const HIGH=[
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+push\b.*--force\b/i,
  /\bdrop\s+(database|table)\b/i,
  /\btruncate\b/i,
  /\bnpm\s+publish\b/i,
  /\bproduction\b.*\bdeploy\b/i,
  /\bdelete\b.*\bcredential\b/i
];

const GUARDED=[
  /\bgit\s+push\b/i,
  /\bdeploy\b/i,
  /\bmigrate\b/i,
  /\bcomposer\s+update\b/i,
  /\bnpm\s+install\b/i,
  /\bexternal\b.*\bwrite\b/i,
  /\bcredential\b/i,
  /\bsecret\b/i,
  /\bdelete\b/i
];

export function decideOperationPolicy(text:string):OperationPolicyDecision{
  const reasons:string[]=[];
  for(const pattern of BLOCKED){
    if(pattern.test(text))reasons.push(`blocked pattern: ${pattern}`);
  }
  if(reasons.length)return {risk:"blocked",approvalRequired:false,blocked:true,reasons};

  for(const pattern of HIGH){
    if(pattern.test(text))reasons.push(`high-risk pattern: ${pattern}`);
  }
  if(reasons.length)return {risk:"high",approvalRequired:true,blocked:false,reasons};

  for(const pattern of GUARDED){
    if(pattern.test(text))reasons.push(`guarded pattern: ${pattern}`);
  }
  if(reasons.length)return {risk:"guarded",approvalRequired:true,blocked:false,reasons};

  return {risk:"safe",approvalRequired:false,blocked:false,reasons:[]};
}
