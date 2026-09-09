"use client";

import {useMemo} from "react";
import type {OfficeAgent} from "@/types/office";
import {useActiveProjectState} from "@/hooks/useActiveProject";
import {usePixelOfficeLiveStore} from "@/pixel-office-v2/live-store";
import {isPixelActive,lookupLiveAgent,pixelStateToOfficeStatus} from "@/pixel-office-v2/agent-match";
import {mergeOfficeRoster} from "@/pixel-office-v2/default-roster";

export function overlayOfficeAgents(agents:OfficeAgent[],liveAgents:Record<string,import("@/pixel-office-v2/live-store").PixelLiveAgent>):OfficeAgent[]{
  return agents.map(agent=>{
    const live=lookupLiveAgent(agent,liveAgents);
    if(!live)return agent;
    const status=pixelStateToOfficeStatus(live.state);
    if(status==="idle"&&agent.status!=="idle")return agent;
    return {
      ...agent,
      status:status==="idle"?agent.status:status,
      task:live.speech||agent.task,
      progressPercent:typeof live.progress==="number"?live.progress:agent.progressPercent
    };
  });
}

export function useLiveOfficeAgents(){
  const state=useActiveProjectState();
  const liveAgents=usePixelOfficeLiveStore(s=>s.liveAgents);
  return useMemo(()=>overlayOfficeAgents(mergeOfficeRoster(state.agents),liveAgents),[state.agents,liveAgents]);
}

export function useLiveOfficeState(){
  const state=useActiveProjectState();
  const agents=useLiveOfficeAgents();
  const liveAgents=usePixelOfficeLiveStore(s=>s.liveAgents);
  const active=useMemo(
    ()=>agents.filter(a=>["working","planning","reviewing","testing","reading"].includes(a.status)).length
      ||Object.values(liveAgents).filter(a=>isPixelActive(a.state)).length,
    [agents,liveAgents]
  );
  return {...state,agents,activeCount:active};
}
