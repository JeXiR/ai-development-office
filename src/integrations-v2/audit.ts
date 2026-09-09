import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {IntegrationAuditEntry,IntegrationActionStatus} from "./types";

export class IntegrationAuditLog{
  private file(projectPath:string){return path.join(projectPath,".ai-kit","integrations","audit.jsonl");}
  append(projectId:string,projectPath:string,input:{
    integrationId:string; action:string; actor:string; status:IntegrationActionStatus;
    attempt:number; durationMs:number; message:string; payloadSummary?:Record<string,unknown>;
  }){
    const file=this.file(projectPath);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const row:IntegrationAuditEntry={
      id:crypto.randomUUID(),projectId,integrationId:input.integrationId,action:input.action,
      actor:input.actor,status:input.status,attempt:input.attempt,durationMs:input.durationMs,
      message:input.message,createdAt:new Date().toISOString(),payloadSummary:input.payloadSummary||{}
    };
    fs.appendFileSync(file,JSON.stringify(row)+"\n","utf8");
    return row;
  }
  list(projectPath:string,limit=500):IntegrationAuditEntry[]{
    const file=this.file(projectPath);
    if(!fs.existsSync(file))return [];
    return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).slice(-limit).map(line=>{
      try{return JSON.parse(line) as IntegrationAuditEntry;}catch{return null;}
    }).filter((x):x is IntegrationAuditEntry=>!!x);
  }
}
