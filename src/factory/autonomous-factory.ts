import {evaluateAgentBudget, type AgentBudgetCeilings, type AgentBudgetDecision} from "./agent-budget";

export type FactoryStatus="idle"|"running"|"paused"|"stopped"|"completed"|"tripped"|"needs_trust";

export type FactoryWorkItem={
  id:string;
  title:string;
  type?:string;
  source?:string;
  sourceFile?:string|null;
  assignedRole?:string|null;
  status?:string;
  deferredReason?:string|null;
};

export type FactoryQueueRecord={
  workItemId?:string|null;
  findingId?:string|null;
  status:string;
};

export type FactoryState={
  projectId:string;
  status:FactoryStatus;
  hiveEnabled:boolean;
  startedAt:string|null;
  stoppedAt:string|null;
  queuedIds:string[];
  completedIds:string[];
  failedIds:string[];
  lastItemId:string|null;
  lastMessage:string;
  tripReason:string|null;
  consecutiveFailures:number;
};

export type FactorySettings={
  hiveEnabled:boolean;
  maxConcurrent:number;
  groupTemplateId:string|null;
  ceilings:AgentBudgetCeilings;
};

export const DEFAULT_FACTORY_SETTINGS:FactorySettings={
  hiveEnabled:true,
  maxConcurrent:2,
  groupTemplateId:null,
  ceilings:{
    maxTokens:250000,
    maxCostUsd:25,
    maxRuntimeMinutes:1440,
    maxConsecutiveFailures:8
  }
};

const ACTIVE_STATUSES=new Set(["queued","waiting_for_agent","planning","plan_ready","running","verifying"]);
const DONE_STATUSES=new Set(["completed"]);

export function emptyFactoryState(projectId:string, hiveEnabled=true):FactoryState{
  return {
    projectId,
    status:"idle",
    hiveEnabled,
    startedAt:null,
    stoppedAt:null,
    queuedIds:[],
    completedIds:[],
    failedIds:[],
    lastItemId:null,
    lastMessage:"Factory idle.",
    tripReason:null,
    consecutiveFailures:0
  };
}

const FACTORY_SOURCES=new Set(["progress","roadmap","security-audit","findings","finding"]);

export function isFactorySource(item:FactoryWorkItem){
  const source=String(item.source||"").toLowerCase();
  const file=String(item.sourceFile||"").replace(/\\/g, "/");
  if(FACTORY_SOURCES.has(source))return true;
  if(/^PROGRESS\.md/i.test(file)||/ROADMAP\.md$/i.test(file))return true;
  return false;
}

export function factorySourceRank(item:FactoryWorkItem){
  const source=String(item.source||"").toLowerCase();
  if(source==="progress")return 0;
  if(source==="security-audit"||source==="findings"||source==="finding")return 1;
  if(source==="roadmap")return 2;
  return 3;
}

export function pickNextFactoryItems(items:FactoryWorkItem[], history:FactoryQueueRecord[], limit:number, skipIds:string[]=[]){
  const claimed=new Set<string>(skipIds.filter(Boolean));
  for(const row of history){
    const id=String(row.workItemId||row.findingId||"");
    if(!id)continue;
    if(ACTIVE_STATUSES.has(row.status)||DONE_STATUSES.has(row.status))claimed.add(id);
  }
  return items
    .filter(item=>isFactorySource(item))
    .filter(item=>!["done","working","deferred"].includes(String(item.status||"todo")))
    .filter(item=>!item.deferredReason)
    .filter(item=>!claimed.has(item.id))
    .slice()
    .sort((a,b)=>factorySourceRank(a)-factorySourceRank(b)||String(a.id).localeCompare(String(b.id)))
    .slice(0, Math.max(0, limit));
}

export function factoryQueueRemaining(state:FactoryState, history:FactoryQueueRecord[]){
  return history.filter(row=>ACTIVE_STATUSES.has(row.status)).length;
}

export function factoryElapsedMinutes(state:FactoryState){
  const started=Date.parse(state.startedAt||"");
  return Number.isFinite(started)?Math.max(0,(Date.now()-started)/60000):0;
}

export function isRetryableFactoryFailure(message:string, verifierStatus?:string|null){
  if(String(verifierStatus||"").toLowerCase()==="error")return true;
  const text=String(message||"").toLowerCase();
  return /timed out|timeout|planning.?only|did not ship product|no product files|econnreset|econnrefused|spawn|enoent|rate limit|\b429\b|temporarily unavailable/.test(text);
}

export function applyFactoryBudget(state:FactoryState, usage:{agentId:string;tokens:number;costUsd:number;runtimeMinutes:number}, ceilings?:Partial<AgentBudgetCeilings>):AgentBudgetDecision{
  const decision=evaluateAgentBudget({
    agentId:usage.agentId,
    tokens:usage.tokens,
    costUsd:usage.costUsd,
    runtimeMinutes:usage.runtimeMinutes,
    consecutiveFailures:state.consecutiveFailures
  }, ceilings);
  if(!decision.ok){
    state.status="tripped";
    state.stoppedAt=new Date().toISOString();
    state.tripReason=decision.reason;
    state.lastMessage=decision.reason||"Circuit breaker tripped.";
  }
  return decision;
}

export function pruneFactoryQueue(state:FactoryState){
  const settled=new Set([...state.completedIds, ...state.failedIds]);
  state.queuedIds=state.queuedIds.filter(id=>!settled.has(id));
  return state;
}

export function shouldApplySessionBudget(state:FactoryState){
  return state.status==="running";
}

export function recoverTrippedFactoryAfterSuccess(state:FactoryState){
  pruneFactoryQueue(state);
  if(state.status!=="tripped")return state;
  if(state.consecutiveFailures>0)return state;
  if(!/:\s*(runtime|tokens|cost)\b/i.test(state.tripReason||""))return state;
  state.status="idle";
  state.tripReason=null;
  return state;
}

export function recordFactoryResult(state:FactoryState, itemId:string, ok:boolean, message:string, extras?:{verifierStatus?:string|null}){
  state.lastItemId=itemId;
  state.lastMessage=message;
  state.queuedIds=state.queuedIds.filter(id=>id!==itemId);
  if(ok){
    state.consecutiveFailures=0;
    if(!state.completedIds.includes(itemId))state.completedIds.push(itemId);
    state.failedIds=state.failedIds.filter(id=>id!==itemId);
    recoverTrippedFactoryAfterSuccess(state);
    return state;
  }
  if(isRetryableFactoryFailure(message, extras?.verifierStatus))return state;
  state.consecutiveFailures+=1;
  if(!state.failedIds.includes(itemId))state.failedIds.push(itemId);
  return state;
}

export function completeFactoryIfIdle(state:FactoryState, remaining:FactoryWorkItem[], history:FactoryQueueRecord[]){
  const next=pickNextFactoryItems(remaining, history, 1, state.failedIds);
  const inflight=factoryQueueRemaining(state, history);
  if(state.status!=="running" || next.length>0 || inflight>0)return state;
  const open=remaining.filter(item=>isFactorySource(item)&&!["done","deferred"].includes(String(item.status||"todo"))&&!item.deferredReason);
  if(open.length){
    state.lastMessage=`Open factory work remains after failures: ${open.map(x=>x.id).join(", ")}. Restart the factory to retry.`;
    return state;
  }
  state.status="completed";
  state.stoppedAt=new Date().toISOString();
  state.lastMessage="Canonical factory work is complete.";
  return state;
}
