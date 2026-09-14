export const MIN_PLAN_CHARS=120;

export type IsolationCandidate={
  label?:string;
  role?:string;
  provider?:string;
  files?:string[];
  ok?:boolean;
  patch?:string;
  output?:string;
  error?:string;
  worktreePath?:string;
  branch?:string;
};

export function claudeResultOkNoPatch(text:string){
  try{
    const parsed=JSON.parse(String(text||"").trim());
    return !!(parsed&&parsed.is_error===false&&(parsed.stop_reason==="end_turn"||!parsed.stop_reason));
  }catch{
    return false;
  }
}

export function isProviderAuthFailure(text:string){
  const raw=String(text||"");
  if(/not signed in|grok login|--device-code|XAI_API_KEY|authentication required|please (?:log|sign) ?in|oauth session expired|failed to authenticate|ERROR\s*[·.]\s*drift not_checked/i.test(raw))return true;
  try{
    const parsed=JSON.parse(raw.trim());
    if(parsed&&parsed.is_error===true&&Number(parsed.duration_api_ms||0)<2000)return true;
  }catch{}
  return false;
}

export function isEmptyCodingSkip(candidate:IsolationCandidate|null|undefined, leadLabel:string){
  if(!candidate||candidate.ok)return false;
  if(candidate.label===leadLabel)return false;
  if(String(candidate.patch||"").trim()||(candidate.files||[]).length)return false;
  const blob=`${candidate.output||""}\n${candidate.error||""}`;
  return /no justified|no code change|nothing to (?:change|implement)|no schema change|no product files changed/i.test(blob)
    || claudeResultOkNoPatch(candidate.output||"")
    || /candidate produced no diff/i.test(String(candidate.error||""))
    || isProviderAuthFailure(blob);
}

export function candidateOverlapFiles(candidates:IsolationCandidate[]){
  const owners=new Map<string,string[]>();
  for(const candidate of candidates){
    for(const file of candidate.files||[]){
      const current=owners.get(file)||[];
      current.push(String(candidate.role||candidate.label||candidate.provider));
      owners.set(file,current);
    }
  }
  return [...owners.entries()].filter(([,roles])=>roles.length>1).map(([file,roles])=>({file,roles}));
}

export function keepLeadOnOverlap<T extends IsolationCandidate>(mergeable:T[], leadLabel:string){
  const overlaps=candidateOverlapFiles(mergeable);
  if(!overlaps.length){
    return {ok:true,keptLead:false,blocked:false,mergeable,dropped:[] as T[],overlaps,summary:""};
  }
  const lead=mergeable.find(candidate=>candidate.label===leadLabel);
  if(lead){
    const dropped=mergeable.filter(candidate=>candidate!==lead);
    return {
      ok:true,
      keptLead:true,
      blocked:false,
      mergeable:[lead],
      dropped,
      overlaps,
      summary:`Overlap on ${overlaps.length} file(s); kept lead ${lead.role||leadLabel}`
    };
  }
  return {
    ok:false,
    keptLead:false,
    blocked:true,
    mergeable:[] as T[],
    dropped:mergeable,
    overlaps,
    summary:`Candidate patch overlap detected: ${overlaps.map(x=>`${x.file} (${x.roles.join(" + ")})`).join("; ")}`
  };
}

export function shouldRetryShortPlan(planLength:number, alreadyRetried:boolean){
  return planLength<MIN_PLAN_CHARS && !alreadyRetried;
}
