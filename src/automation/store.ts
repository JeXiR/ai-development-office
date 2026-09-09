import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {AutomationSnapshot,HeartbeatState,MissionCadence,ScheduledMission} from "./types";

function now(){return new Date().toISOString();}

function nextRun(cadence:MissionCadence,from=new Date()){
  const d=new Date(from);
  if(cadence==="hourly")d.setHours(d.getHours()+1);
  else if(cadence==="daily")d.setDate(d.getDate()+1);
  else if(cadence==="weekly")d.setDate(d.getDate()+7);
  else d.setMinutes(d.getMinutes()+1);
  return d.toISOString();
}

export class AutomationStore{
  private file(projectPath:string){
    return path.join(projectPath,".ai-kit","automation","state.json");
  }

  load(projectPath:string):AutomationSnapshot{
    try{
      const raw=JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"));
      return {
        missions:Array.isArray(raw?.missions)?raw.missions:[],
        heartbeats:Array.isArray(raw?.heartbeats)?raw.heartbeats:[]
      };
    }catch{
      return {missions:[],heartbeats:[]};
    }
  }

  save(projectPath:string,snapshot:AutomationSnapshot){
    const file=this.file(projectPath);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const tmp=file+".tmp";
    fs.writeFileSync(tmp,JSON.stringify(snapshot,null,2),"utf8");
    fs.renameSync(tmp,file);
  }

  createMission(projectId:string,projectPath:string,input:{
    title:string;prompt:string;provider?:string;role?:string;cadence:MissionCadence;
    nextRunAt?:string;maxRetries?:number;
  }){
    const state=this.load(projectPath);
    const stamp=now();
    const mission:ScheduledMission={
      id:crypto.randomUUID(),
      projectId,
      title:input.title.trim(),
      prompt:input.prompt.trim(),
      provider:input.provider||"auto",
      role:input.role||"general",
      cadence:input.cadence,
      nextRunAt:input.nextRunAt||nextRun(input.cadence),
      enabled:true,
      status:"scheduled",
      retryCount:0,
      maxRetries:Math.max(0,Math.min(10,input.maxRetries??2)),
      lastRunAt:null,
      lastResult:null,
      createdAt:stamp,
      updatedAt:stamp
    };
    state.missions.push(mission);
    this.save(projectPath,state);
    return mission;
  }

  updateMission(projectPath:string,id:string,patch:Partial<Pick<ScheduledMission,"enabled"|"status"|"nextRunAt"|"retryCount"|"lastRunAt"|"lastResult">>){
    const state=this.load(projectPath);
    const row=state.missions.find(x=>x.id===id);
    if(!row)return null;
    Object.assign(row,patch,{updatedAt:now()});
    this.save(projectPath,state);
    return row;
  }

  removeMission(projectPath:string,id:string){
    const state=this.load(projectPath);
    const before=state.missions.length;
    state.missions=state.missions.filter(x=>x.id!==id);
    this.save(projectPath,state);
    return state.missions.length<before;
  }

  due(projectPath:string,at=new Date()){
    const state=this.load(projectPath);
    const nowMs=at.getTime();
    return state.missions.filter(x=>
      x.enabled &&
      x.status!=="running" &&
      Date.parse(x.nextRunAt)<=nowMs
    );
  }

  scheduleNext(projectPath:string,id:string){
    const state=this.load(projectPath);
    const row=state.missions.find(x=>x.id===id);
    if(!row)return null;
    if(row.cadence==="once"){
      row.enabled=false;
      row.status="completed";
    }else{
      row.nextRunAt=nextRun(row.cadence,new Date());
      row.status="scheduled";
    }
    row.updatedAt=now();
    this.save(projectPath,state);
    return row;
  }

  heartbeat(projectId:string,projectPath:string,input:{enabled:boolean;intervalMinutes:number}){
    const state=this.load(projectPath);
    let hb=state.heartbeats.find(x=>x.projectId===projectId);
    if(!hb){
      hb={projectId,enabled:false,intervalMinutes:15,lastBeatAt:null,nextBeatAt:null,missedBeats:0};
      state.heartbeats.push(hb);
    }
    hb.enabled=input.enabled;
    hb.intervalMinutes=Math.max(5,Math.min(1440,input.intervalMinutes));
    hb.nextBeatAt=input.enabled?new Date(Date.now()+hb.intervalMinutes*60000).toISOString():null;
    this.save(projectPath,state);
    return hb;
  }

  recordBeat(projectId:string,projectPath:string){
    const state=this.load(projectPath);
    let hb=state.heartbeats.find(x=>x.projectId===projectId);
    if(!hb){
      hb={projectId,enabled:true,intervalMinutes:15,lastBeatAt:null,nextBeatAt:null,missedBeats:0};
      state.heartbeats.push(hb);
    }
    hb.lastBeatAt=now();
    hb.nextBeatAt=new Date(Date.now()+hb.intervalMinutes*60000).toISOString();
    hb.missedBeats=0;
    this.save(projectPath,state);
    return hb;
  }
}
