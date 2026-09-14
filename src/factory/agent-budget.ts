export type AgentBudgetCeilings={
  maxTokens:number;
  maxCostUsd:number;
  maxRuntimeMinutes:number;
  maxConsecutiveFailures:number;
};

export type AgentBudgetUsage={
  agentId:string;
  tokens:number;
  costUsd:number;
  runtimeMinutes:number;
  consecutiveFailures:number;
};

export type AgentBudgetDecision={
  ok:boolean;
  action:"continue"|"constrain"|"stop";
  reason:string|null;
  violations:string[];
};

export const DEFAULT_AGENT_BUDGET:AgentBudgetCeilings={
  maxTokens:250000,
  maxCostUsd:25,
  maxRuntimeMinutes:1440,
  maxConsecutiveFailures:8
};

export function estimateTokensFromText(text:string){
  const chars=String(text||"").length;
  return Math.max(0, Math.round(chars/4));
}

export function estimateCostUsd(tokens:number, relativeCost=1){
  return Number(((tokens/1000)*0.002*relativeCost).toFixed(4));
}

export function evaluateAgentBudget(usage:AgentBudgetUsage, ceilings:Partial<AgentBudgetCeilings>={}):AgentBudgetDecision{
  const cap={...DEFAULT_AGENT_BUDGET, ...ceilings};
  const violations:string[]=[];
  if(usage.tokens>=cap.maxTokens)violations.push("tokens");
  if(usage.costUsd>=cap.maxCostUsd)violations.push("cost");
  if(usage.runtimeMinutes>=cap.maxRuntimeMinutes)violations.push("runtime");
  if(usage.consecutiveFailures>=cap.maxConsecutiveFailures)violations.push("failures");
  if(!violations.length)return {ok:true, action:"continue", reason:null, violations};
  const action=violations.includes("failures")||violations.includes("tokens")||violations.includes("cost")||violations.includes("runtime")?"stop":"constrain";
  return {
    ok:false,
    action,
    reason:`Per-agent circuit breaker tripped for ${usage.agentId}: ${violations.join(", ")}.`,
    violations
  };
}
