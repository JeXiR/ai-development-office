import type {RuntimeEvent} from "@/runtime/types";
import type {MailMessage} from "@/collaboration/types";
import type {PixelAgent,PixelOfficeSnapshot} from "./types";
import {stationForSignal} from "./stations";

function stamp(){return new Date().toISOString();}
function officeId(){
  const randomUUID=globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if(randomUUID)return randomUUID();
  return `office-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
}
function agentFor(snapshot:PixelOfficeSnapshot,id:string,role:string,provider:string){
 let row=snapshot.agents.find(x=>x.id===id);
 if(!row){row={id,role,provider,state:"idle",station:"lounge",targetStation:null,speech:null,taskLabel:null,progress:null,lastEventAt:stamp()};snapshot.agents.push(row);}
 return row;
}
export class PixelOfficeReducer{
 initial():PixelOfficeSnapshot{return {agents:[],envelopes:[],filePulses:[]};}
 runtime(snapshot:PixelOfficeSnapshot,event:RuntimeEvent){
  const next={agents:snapshot.agents.map(x=>({...x})),envelopes:snapshot.envelopes.map(x=>({...x})),filePulses:snapshot.filePulses.map(x=>({...x}))};
  const a=agentFor(next,event.agentId,event.role,event.provider); const station=stationForSignal({role:event.role,eventType:event.type,payload:event.payload}); a.lastEventAt=event.timestamp;
  if(event.type==="runtime.session.starting"){a.state="moving";a.targetStation="terminal";a.speech="Starting runtime…";}
  else if(event.type==="runtime.session.started"){a.state="working";a.station="terminal";a.targetStation=null;a.speech="Runtime ready";}
  else if(event.type==="runtime.session.output"){a.state="working";a.station=station;a.targetStation=null;const data=String(event.payload.data||"").trim();if(data)a.speech=data.slice(-120);}
  else if(event.type==="runtime.session.input"){const c=String(event.payload.control||"");if(c==="pause"){a.state="paused";a.speech="Paused";}else if(c==="constrain"){a.state="blocked";a.speech="Constraint applied";}else if(c==="resume"){a.state="working";a.speech="Resumed";}else if(c==="steer"){a.state="thinking";a.speech=String(event.payload.message||"Steering…").slice(0,120);}else{a.state="working";a.station=station;}}
  else if(event.type==="runtime.session.stopping"){a.state="moving";a.targetStation="lounge";a.speech="Stopping…";}
  else if(event.type==="runtime.session.exited"){a.state="done";a.station="lounge";a.targetStation=null;a.speech="Done";a.progress=100;}
  else if(event.type==="runtime.session.failed"){a.state="blocked";a.speech=String(event.payload.message||"Runtime failed").slice(0,120);}
  return this.trim(next);
 }
 message(snapshot:PixelOfficeSnapshot,m:MailMessage){const next={...snapshot,envelopes:snapshot.envelopes.map(x=>({...x}))};next.envelopes.push({id:m.id||officeId(),fromAgentId:m.fromAgentId,toAgentId:m.toAgentId,subject:m.subject,createdAt:m.createdAt||stamp(),status:"flying"});return this.trim(next);}
 file(snapshot:PixelOfficeSnapshot,relativePath:string,agentId:string|null){const next={...snapshot,filePulses:snapshot.filePulses.map(x=>({...x}))};next.filePulses.push({id:officeId(),relativePath,agentId,createdAt:stamp()});return this.trim(next);}
 task(snapshot:PixelOfficeSnapshot,input:{agentId:string;role:string;provider?:string;label:string;status:string;progress?:number|null}){const next={...snapshot,agents:snapshot.agents.map(x=>({...x}))};const a=agentFor(next,input.agentId,input.role,input.provider||"auto");a.taskLabel=input.label;a.progress=input.progress??a.progress;if(input.status==="blocked")a.state="blocked";else if(input.status==="done")a.state="done";else if(input.status==="working")a.state="working";else if(["queued","planned"].includes(input.status))a.state="thinking";a.lastEventAt=stamp();return this.trim(next);}
 private trim(s:PixelOfficeSnapshot){const cut=Date.now()-5*60*1000;s.envelopes=s.envelopes.filter(x=>Date.parse(x.createdAt)>=cut).slice(-30);s.filePulses=s.filePulses.filter(x=>Date.parse(x.createdAt)>=cut).slice(-40);s.agents=s.agents.slice(-40);return s;}
}
