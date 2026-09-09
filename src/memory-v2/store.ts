import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {atomicWriteJson} from "@/recovery/atomic-write";
import type {MemoryCategory,MemoryScope,MemoryV2Record} from "./types";

function now(){return new Date().toISOString();}

export class MemoryV2Store{
  private file(projectPath:string){return path.join(projectPath,".ai-kit","memory-v2","records.json");}

  list(projectPath:string):MemoryV2Record[]{
    try{
      const rows=JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"));
      return Array.isArray(rows)?rows:[];
    }catch{return [];}
  }

  save(projectPath:string,rows:MemoryV2Record[]){
    atomicWriteJson(this.file(projectPath),rows.slice(-20000));
  }

  add(projectId:string,projectPath:string,input:{
    category:MemoryCategory;scope:MemoryScope;agentId?:string|null;taskId?:string|null;
    title:string;body:string;tags?:string[];embedding?:number[]|null;embeddingModel?:string|null;
    importance?:number;confidence?:number;expiresAt?:string|null;
    provenance?:MemoryV2Record["provenance"];
  }){
    const rows=this.list(projectPath);
    const stamp=now();
    const normalizedBody=input.body.trim().replace(/\s+/g," ");
    const duplicate=rows.find(x=>
      x.category===input.category &&
      x.scope===input.scope &&
      x.agentId===(input.agentId??null) &&
      x.taskId===(input.taskId??null) &&
      x.title.trim().toLowerCase()===input.title.trim().toLowerCase() &&
      x.body.trim().replace(/\s+/g," ").toLowerCase()===normalizedBody.toLowerCase()
    );

    if(duplicate){
      duplicate.updatedAt=stamp;
      duplicate.importance=Math.max(duplicate.importance,input.importance??duplicate.importance);
      duplicate.confidence=Math.max(duplicate.confidence,input.confidence??duplicate.confidence);
      duplicate.tags=[...new Set([...duplicate.tags,...(input.tags||[])])];
      if(input.embedding){duplicate.embedding=input.embedding;duplicate.embeddingModel=input.embeddingModel??duplicate.embeddingModel;}
      this.save(projectPath,rows);
      return duplicate;
    }

    const record:MemoryV2Record={
      id:crypto.randomUUID(),projectId,
      category:input.category,scope:input.scope,
      agentId:input.agentId??null,taskId:input.taskId??null,
      title:input.title.trim(),body:input.body.trim(),
      tags:[...new Set(input.tags||[])],
      embedding:input.embedding??null,
      embeddingModel:input.embeddingModel??null,
      importance:Math.max(0,Math.min(1,input.importance??0.6)),
      confidence:Math.max(0,Math.min(1,input.confidence??0.7)),
      accessCount:0,createdAt:stamp,updatedAt:stamp,lastAccessedAt:null,
      expiresAt:input.expiresAt??null,
      provenance:input.provenance??{sourceType:"user",sourceId:null,actor:null}
    };
    rows.push(record);this.save(projectPath,rows);return record;
  }

  touch(projectPath:string,id:string){
    const rows=this.list(projectPath),row=rows.find(x=>x.id===id);
    if(!row)return null;
    row.accessCount++;row.lastAccessedAt=now();row.updatedAt=now();
    this.save(projectPath,rows);return row;
  }

  remove(projectPath:string,id:string){
    const rows=this.list(projectPath).filter(x=>x.id!==id);
    this.save(projectPath,rows);return true;
  }

  prune(projectPath:string){
    const nowMs=Date.now();
    const rows=this.list(projectPath);
    const kept=rows.filter(x=>{
      if(x.expiresAt&&Date.parse(x.expiresAt)<nowMs)return false;
      const ageDays=Math.max(0,(nowMs-Date.parse(x.updatedAt))/86400000);
      const decay=Math.max(0,1-ageDays/365);
      const retention=x.importance*0.55+x.confidence*0.25+Math.min(0.2,x.accessCount/50)+decay*0.1;
      return retention>=0.25;
    });
    this.save(projectPath,kept);
    return {before:rows.length,after:kept.length,removed:rows.length-kept.length};
  }
}
