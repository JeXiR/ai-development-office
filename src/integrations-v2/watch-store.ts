import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {atomicWriteJson} from "@/recovery/atomic-write";
import type {IntegrationWatch} from "./types";

export class IntegrationWatchStore{
  private file(projectPath:string){return path.join(projectPath,".ai-kit","integrations","watches.json");}
  list(projectPath:string):IntegrationWatch[]{
    try{const rows=JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"));return Array.isArray(rows)?rows:[];}catch{return [];}
  }
  save(projectPath:string,rows:IntegrationWatch[]){atomicWriteJson(this.file(projectPath),rows);}
  add(projectId:string,projectPath:string,input:{integrationId:string;kind:IntegrationWatch["kind"];resource:string;intervalMinutes:number;}){
    const rows=this.list(projectPath);
    const row:IntegrationWatch={id:crypto.randomUUID(),projectId,integrationId:input.integrationId,kind:input.kind,
      resource:input.resource,enabled:true,intervalMinutes:Math.max(5,Math.min(1440,input.intervalMinutes)),
      lastCheckedAt:null,lastState:null,createdAt:new Date().toISOString()};
    rows.push(row);this.save(projectPath,rows);return row;
  }
  updateState(projectPath:string,id:string,state:string){
    const rows=this.list(projectPath),row=rows.find(x=>x.id===id);if(!row)return null;
    row.lastCheckedAt=new Date().toISOString();row.lastState=state;this.save(projectPath,rows);return row;
  }
  remove(projectPath:string,id:string){this.save(projectPath,this.list(projectPath).filter(x=>x.id!==id));return true;}
}
