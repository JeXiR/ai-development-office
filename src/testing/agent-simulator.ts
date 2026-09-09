import type {RuntimeEvent,RuntimeProvider} from "@/runtime/types";

export type SimulatedAgentInput={
  projectId:string;
  sessionId:string;
  agentId:string;
  role:string;
  provider:RuntimeProvider;
};

export function simulatedLifecycle(input:SimulatedAgentInput):RuntimeEvent[]{
  const t=Date.now();
  const event=(type:RuntimeEvent["type"],offset:number,payload:Record<string,unknown>):RuntimeEvent=>({
    id:`sim-${input.sessionId}-${offset}`,
    type,
    timestamp:new Date(t+offset).toISOString(),
    sessionId:input.sessionId,
    projectId:input.projectId,
    agentId:input.agentId,
    role:input.role,
    provider:input.provider,
    payload
  });

  return [
    event("runtime.session.starting",0,{}),
    event("runtime.session.started",1,{}),
    event("runtime.session.input",2,{data:"npm test"}),
    event("runtime.session.output",3,{data:"PASS"}),
    event("runtime.session.stopping",4,{}),
    event("runtime.session.exited",5,{exitCode:0})
  ];
}
