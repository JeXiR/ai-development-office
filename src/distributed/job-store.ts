import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {atomicWriteJson} from "@/recovery/atomic-write";
import type {DistributedJob,DistributedJobStatus} from "./types";

function now(){return new Date().toISOString();}

export class DistributedJobStore{
  private file(projectPath:string){return path.join(projectPath,".ai-kit","workers","jobs.json");}

  list(projectPath:string):DistributedJob[]{
    try{
      const rows=JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"));
      return Array.isArray(rows)?rows:[];
    }catch{return [];}
  }

  save(projectPath:string,rows:DistributedJob[]){
    atomicWriteJson(this.file(projectPath),rows.slice(-5000));
  }

  create(projectId:string,projectPath:string,input:{
    command:string;cwd?:string|null;requiredTags?:string[];maxAttempts?:number;
  }){
    const rows=this.list(projectPath);
    const row:DistributedJob={
      id:crypto.randomUUID(),projectId,workerId:null,
      command:input.command,cwd:input.cwd??null,requiredTags:input.requiredTags||[],
      status:"queued",attempt:0,maxAttempts:Math.max(1,Math.min(10,input.maxAttempts??3)),
      createdAt:now(),startedAt:null,finishedAt:null,exitCode:null,error:null,logFile:null,artifactPaths:[]
    };
    rows.push(row);this.save(projectPath,rows);return row;
  }

  update(projectPath:string,id:string,patch:Partial<DistributedJob>){
    const rows=this.list(projectPath);
    const row=rows.find(x=>x.id===id);
    if(!row)return null;
    Object.assign(row,patch);
    this.save(projectPath,rows);
    return row;
  }

  activeCount(projectPath:string,workerId:string){
    return this.list(projectPath).filter(x=>x.workerId===workerId&&(x.status==="running"||x.status==="retrying")).length;
  }

  recoverInterrupted(projectPath:string){
    const rows=this.list(projectPath);
    let recovered=0;
    for(const row of rows){
      if(row.status==="running"){
        row.status=row.attempt<row.maxAttempts?"retrying":"failed";
        row.error="Office restarted while job was running.";
        row.finishedAt=now();
        recovered++;
      }
    }
    if(recovered)this.save(projectPath,rows);
    return {recovered};
  }
}
