import crypto from "node:crypto";
import type {RuntimeEvent,RuntimeEventType,RuntimeProvider} from "./types";

type RuntimeListener=(event:RuntimeEvent)=>void;

export class RuntimeEventBus{
  private listeners=new Set<RuntimeListener>();
  private history:RuntimeEvent[]=[];
  constructor(private readonly historyLimit=1000){}

  subscribe(listener:RuntimeListener){
    this.listeners.add(listener);
    return ()=>this.listeners.delete(listener);
  }

  publish(input:{
    type:RuntimeEventType;
    sessionId:string;
    projectId:string;
    agentId:string;
    role:string;
    provider:RuntimeProvider;
    payload?:Record<string,unknown>;
  }){
    const event:RuntimeEvent={
      id:crypto.randomUUID(),
      type:input.type,
      timestamp:new Date().toISOString(),
      sessionId:input.sessionId,
      projectId:input.projectId,
      agentId:input.agentId,
      role:input.role,
      provider:input.provider,
      payload:input.payload||{}
    };
    this.history.push(event);
    if(this.history.length>this.historyLimit)this.history.splice(0,this.history.length-this.historyLimit);
    for(const listener of this.listeners){
      try{listener(event);}catch{}
    }
    return event;
  }

  recent(limit=100){
    return this.history.slice(-Math.max(1,Math.min(limit,this.historyLimit)));
  }
}
