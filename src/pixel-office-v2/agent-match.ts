type LiveLike={id:string;role?:string|null};

export function normalizeAgentKey(value:string){
  return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}

export function collectEventAgentIds(event:any):string[]{
  const ids=new Set<string>();
  const add=(value:unknown)=>{
    const text=String(value||"").trim();
    if(text&&text.toLowerCase()!=="general"&&text.toLowerCase()!=="unknown")ids.add(text);
  };
  add(event?.agentId);
  add(event?.data?.agentId);
  add(event?.actor?.id);
  add(event?.actor?.role);
  add(event?.assignedRole);
  add(event?.assignedAgentId);
  add(event?.executionLane);
  add(event?.role);
  add(event?.data?.role);
  const assignments=event?.data?.assignments||event?.assignments;
  if(Array.isArray(assignments)){
    for(const row of assignments){
      add(row?.agentId);
      add(row?.role);
      add(row?.assignedRole);
    }
  }
  const agents=event?.data?.agents||event?.agents;
  if(Array.isArray(agents)){
    for(const row of agents)add(typeof row==="string"?row:row?.id||row?.role||row?.agentId);
  }
  for(const key of ["completedAgents","failedAgents","activeAgents"]){
    const list=event?.data?.[key];
    if(Array.isArray(list))list.forEach(add);
  }
  return [...ids];
}

export function resolveLiveAgentId(raw:string,roster:Record<string,LiveLike>):string|null{
  const key=normalizeAgentKey(raw);
  if(!key)return null;
  if(roster[raw])return raw;
  if(roster[key])return key;
  for(const [id,agent] of Object.entries(roster)){
    if(normalizeAgentKey(id)===key)return id;
    if(normalizeAgentKey(agent.role)===key)return id;
    if(normalizeAgentKey(agent.id)===key)return id;
  }
  return raw;
}

export function lookupLiveAgent<T extends {id:string;role?:string|null;displayName?:string|null},TLive extends LiveLike>(
  agent:T,
  liveAgents:Record<string,TLive>
):TLive|null{
  const keys=[agent.id,agent.role,agent.displayName].filter(Boolean).map(value=>normalizeAgentKey(String(value)));
  for(const [id,live] of Object.entries(liveAgents)){
    const liveKeys=[id,live.id,live.role].map(normalizeAgentKey);
    if(keys.some(key=>key&&liveKeys.includes(key)))return live;
  }
  return null;
}

const ROLE_HINTS:Array<{keys:RegExp;ids:string[]}> = [
  {keys:/ceo|director|chief executive/,ids:["ceo","director"]},
  {keys:/cto|chief technology/,ids:["cto"]},
  {keys:/\bpm\b|product manager|project manager/,ids:["pm"]},
  {keys:/architect|architecture/,ids:["architect"]},
  {keys:/\bqa\b|test|spec|coverage|assert/,ids:["qa"]},
  {keys:/security|vulnerab|audit|auth|permission/,ids:["security"]},
  {keys:/devops|deploy|docker|ci\/cd|pipeline/,ids:["devops"]},
  {keys:/docs|documentation|readme|roadmap/,ids:["docs"]},
  {keys:/frontend|react|next|ui|css|component/,ids:["frontend","nextjs"]},
  {keys:/backend|laravel|nest|api|php|worker|queue/,ids:["backend","laravel","nestjs","api","worker"]},
  {keys:/database|sql|prisma|mysql|postgres/,ids:["database","mysql","postgres"]},
  {keys:/flutter|expo|react-native|mobile/,ids:["flutter","expo","react-native"]},
];

export function inferRosterAgentIds(text:string,type:string,roster:Record<string,LiveLike>):string[]{
  const haystack=`${type} ${text}`.toLowerCase();
  const rosterIds=Object.keys(roster);
  if(!rosterIds.length)return [];

  const matched=new Set<string>();
  for(const hint of ROLE_HINTS){
    if(!hint.keys.test(haystack))continue;
    for(const id of rosterIds){
      const agent=roster[id];
      const token=`${normalizeAgentKey(id)} ${normalizeAgentKey(agent.role)}`;
      if(hint.ids.some(hintId=>token.includes(hintId)))matched.add(id);
    }
  }

  if(matched.size)return [...matched];

  if(/mission\.(started|planned|approval)/.test(haystack)){
    return rosterIds.filter(id=>{
      const token=`${normalizeAgentKey(id)} ${normalizeAgentKey(roster[id].role)}`;
      return /ceo|cto|pm|architect|director/.test(token);
    });
  }
  if(/mission\.(testing|test_result)/.test(haystack)){
    return rosterIds.filter(id=>/qa|test|security/.test(`${normalizeAgentKey(id)} ${normalizeAgentKey(roster[id].role)}`));
  }
  if(/mission\.(review|review_result)/.test(haystack)){
    return rosterIds.filter(id=>/cto|architect|security|git/.test(`${normalizeAgentKey(id)} ${normalizeAgentKey(roster[id].role)}`));
  }
  return [];
}

export function pixelStateToOfficeStatus(state:string){
  const value=String(state||"").toLowerCase();
  if(value==="thinking")return "planning";
  if(value==="working"||value==="typing"||value==="walking"||value==="talking")return "working";
  if(value==="testing")return "testing";
  if(value==="blocked")return "blocked";
  if(value==="done")return "done";
  return "idle";
}

export function isPixelActive(state:string){
  return ["thinking","working","moving","walking","testing","talking","typing"].includes(String(state||"").toLowerCase());
}
