import {create} from "zustand";
import type {PixelAgentState,PixelStationId} from "./types";
import {mapOfficeRuntimeEvent,roleDefaultStation} from "./event-map";
import {inferRosterAgentIds,isPixelActive,normalizeAgentKey,resolveLiveAgentId} from "./agent-match";

export type PixelLiveAgent={
  id:string;
  role:string;
  state:PixelAgentState;
  station:PixelStationId;
  speech:string|null;
  progress:number|null;
  lastAt:number;
};

export type PixelMessageAnimation={
  id:string;
  fromAgentId:string;
  toAgentId:string;
  text:string;
  createdAt:number;
  durationMs:number;
};

type State={
  liveAgents:Record<string,PixelLiveAgent>;
  messages:PixelMessageAnimation[];
  seedAgents:(agents:Array<{id:string;role?:string;state?:string;station?:PixelStationId}>)=>void;
  ingest:(event:any)=>void;
  ingestCommands:(commands:Array<any>)=>void;
  sendAgentMessage:(fromAgentId:string,toAgentId:string,text:string)=>void;
  pruneMessages:()=>void;
};

function now(){
  return typeof performance!=="undefined"?performance.now():Date.now();
}

function applyMapped(
  next:Record<string,PixelLiveAgent>,
  id:string,
  mapped:{state:PixelAgentState|null;station:PixelStationId|null;speech:string|null},
  event:any
){
  const current=next[id]||{
    id,
    role:id,
    state:"idle" as PixelAgentState,
    station:"lounge" as PixelStationId,
    speech:null,
    progress:null,
    lastAt:now()
  };
  next[id]={
    ...current,
    state:mapped.state||current.state,
    station:mapped.station||current.station,
    speech:mapped.speech||current.speech,
    progress:typeof event?.data?.progress==="number"?event.data.progress:current.progress,
    lastAt:now()
  };
}

export const usePixelOfficeLiveStore=create<State>((set)=>({
  liveAgents:{},
  messages:[],

  seedAgents:(agents)=>set(state=>{
    let changed=false;
    const next={...state.liveAgents};

    for(const agent of agents){
      const match=resolveLiveAgentId(agent.id,next)||Object.keys(next).find(id=>{
        const live=next[id];
        return normalizeAgentKey(live.role)===normalizeAgentKey(agent.role||agent.id);
      });
      if(match&&next[match]){
        if(match!==agent.id){
          next[agent.id]={...next[match],id:agent.id,role:agent.role||next[match].role};
          delete next[match];
          changed=true;
        }else{
          if(agent.role&&next[agent.id].role!==agent.role){
            next[agent.id]={...next[agent.id],role:agent.role};
            changed=true;
          }
          if(agent.station&&next[agent.id].station!==agent.station&&!isPixelActive(next[agent.id].state)){
            next[agent.id]={...next[agent.id],station:agent.station};
            changed=true;
          }
        }
        continue;
      }
      next[agent.id]={
        id:agent.id,
        role:agent.role||"agent",
        state:"idle",
        station:agent.station||roleDefaultStation(agent.role||agent.id),
        speech:null,
        progress:null,
        lastAt:0
      };
      changed=true;
    }

    return changed?{liveAgents:next}:state;
  }),

  ingest:(event:any)=>set(state=>{
    const mapped=mapOfficeRuntimeEvent(event);
    const next={...state.liveAgents};
    const messages=state.messages.slice();
    const type=String(event?.type||event?.event_type||"").toLowerCase();
    const text=String(event?.message||event?.data?.message||event?.data?.goal||event?.task||event?.title||"");

    let targets=mapped.agentIds
      .map(id=>resolveLiveAgentId(id,next))
      .filter((id):id is string=>Boolean(id));

    if(!targets.length){
      targets=inferRosterAgentIds(text,type,next);
    }

    if(!targets.length&&/mission\.(completed|cancelled|failed)/.test(type)){
      targets=Object.keys(next).filter(id=>["thinking","working","testing","talking","typing"].includes(next[id].state));
    }

    for(const id of [...new Set(targets)]){
      applyMapped(next,id,mapped,event);
    }

    if((event?.type==="provider_stream_event"||type.includes("stream"))&&targets[0]){
      messages.push({
        id:`msg-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        fromAgentId:resolveLiveAgentId("director",next)||"ceo",
        toAgentId:targets[0],
        text:mapped.speech||"provider update",
        createdAt:now(),
        durationMs:4200
      });
    }

    if(event?.targetAgentId&&targets[0]){
      const to=resolveLiveAgentId(String(event.targetAgentId),next)||String(event.targetAgentId);
      messages.push({
        id:`msg-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        fromAgentId:targets[0],
        toAgentId:to,
        text:mapped.speech||"message",
        createdAt:now(),
        durationMs:4200
      });
    }

    return {liveAgents:next,messages};
  }),

  ingestCommands:(commands)=>set(state=>{
    const next={...state.liveAgents};
    let changed=false;
    const active=new Set(["planning","running","verifying"]);
    const nowMs=Date.now();
    for(const command of Array.isArray(commands)?commands:[]){
      if(!active.has(String(command?.status||"")))continue;
      if(command?.mergeGateStatus==="blocked")continue;
      const ts=Date.parse(command?.updatedAt||command?.startedAt||command?.createdAt||"");
      if(Number.isFinite(ts)&&nowMs-ts>12*60*1000)continue;
      const raw=String(command?.assignedRole||command?.assignedAgentId||command?.executionLane||"");
      const id=resolveLiveAgentId(raw,next);
      if(!id)continue;
      const mapped=mapOfficeRuntimeEvent({
        type:command.status==="planning"?"agent.planning":"agent.started",
        agentId:id,
        message:command.title||command.command||"Assigned work",
        status:command.status
      });
      applyMapped(next,id,mapped,command);
      changed=true;
    }
    return changed?{liveAgents:next}:state;
  }),

  sendAgentMessage:(fromAgentId,toAgentId,text)=>set(state=>({
    messages:[...state.messages,{
      id:`msg-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      fromAgentId,toAgentId,text,
      createdAt:now(),
      durationMs:4200
    }]
  })),

  pruneMessages:()=>set(state=>{
    const t=now();
    const messages=state.messages.filter(x=>t-x.createdAt<x.durationMs);
    let changed=messages.length!==state.messages.length;
    const liveAgents={...state.liveAgents};
    for(const [id,agent] of Object.entries(liveAgents)){
      if(agent.state==="idle"||!agent.lastAt)continue;
      const age=t-agent.lastAt;
      const ttl=agent.state==="done"?45000:["working","testing","thinking","talking","typing"].includes(agent.state)?8*60*1000:3*60*1000;
      if(age<=ttl)continue;
      const keepSpeech=age<16000?agent.speech:null;
      liveAgents[id]={...agent,state:"idle",speech:keepSpeech,station:roleDefaultStation(agent.role||id)};
      changed=true;
    }
    return changed?{messages,liveAgents}:state;
  })
}));
