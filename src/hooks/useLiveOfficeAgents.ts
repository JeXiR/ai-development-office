"use client";

import {useEffect,useMemo,useState} from "react";
import type {OfficeAgent} from "@/types/office";
import {useActiveProjectState} from "@/hooks/useActiveProject";
import {useOfficeStore} from "@/store/useOfficeStore";
import {usePixelOfficeLiveStore} from "@/pixel-office-v2/live-store";
import {isPixelActive,lookupLiveAgent,pixelStateToOfficeStatus} from "@/pixel-office-v2/agent-match";
import {mergeOfficeRoster} from "@/pixel-office-v2/default-roster";
import {commandMatchesAgent,commandStageProgress} from "@/factory/command-progress";

export function overlayOfficeAgents(
  agents:OfficeAgent[],
  liveAgents:Record<string,import("@/pixel-office-v2/live-store").PixelLiveAgent>,
  commands:Array<any>=[]
):OfficeAgent[]{
  return agents.map(agent=>{
    const live=lookupLiveAgent(agent,liveAgents);
    const mine=commands.filter(command=>commandMatchesAgent(command,agent));
    const active=mine
      .filter(command=>["queued","waiting_for_agent","planning","plan_ready","running","verifying"].includes(String(command?.status||"")))
      .slice()
      .sort((a,b)=>String(b.updatedAt||b.startedAt||"").localeCompare(String(a.updatedAt||a.startedAt||"")));
    const stage=active[0]?commandStageProgress(active[0].status,active[0].startedAt,active[0].updatedAt):null;
    const liveProgress=typeof live?.progress==="number"?live.progress:null;
    const progressPercent=liveProgress??stage??agent.progressPercent;
    const fromCommand=active[0]?({
      planning:"planning",
      plan_ready:"planning",
      verifying:"testing",
      queued:"working",
      waiting_for_agent:"working",
      running:"working"
    } as Record<string,OfficeAgent["status"]>)[String(active[0].status)]||"working":null;
    if(!live){
      if(fromCommand){
        return {
          ...agent,
          status:fromCommand,
          task:active[0].workItemTitle||active[0].command||agent.task,
          progressPercent
        };
      }
      return progressPercent===agent.progressPercent?agent:{...agent,progressPercent};
    }
    const status=pixelStateToOfficeStatus(live.state);
    if((status==="idle"||!status)&&fromCommand){
      return {
        ...agent,
        status:fromCommand,
        task:active[0]?.workItemTitle||active[0]?.command||agent.task,
        progressPercent
      };
    }
    if(status==="idle"&&agent.status!=="idle")return {...agent,progressPercent};
    return {
      ...agent,
      status:status==="idle"?agent.status:status,
      task:live.speech||agent.task,
      progressPercent
    };
  });
}

export function useLiveOfficeAgents(){
  const state=useActiveProjectState();
  const liveAgents=usePixelOfficeLiveStore(s=>s.liveAgents);
  const projectId=state.projectId;
  const commandHistory=useOfficeStore(s=>s.commandHistory);
  const commands=useMemo(()=>commandHistory.filter(item=>item.projectId===projectId),[commandHistory,projectId]);
  const [clock,setClock]=useState(0);
  useEffect(()=>{
    const timer=window.setInterval(()=>setClock(Date.now()),15000);
    return()=>window.clearInterval(timer);
  },[]);
  return useMemo(()=>overlayOfficeAgents(mergeOfficeRoster(state.agents),liveAgents,commands),[state.agents,liveAgents,commands,clock]);
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
