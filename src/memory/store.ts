import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {MemoryKind,MemoryRecord,MemorySnapshot} from "./types";

type RawStore={
  shared:MemoryRecord[];
  agents:Record<string,MemoryRecord[]>;
};

function now(){return new Date().toISOString();}

function normalize(raw:any):RawStore{
  return {
    shared:Array.isArray(raw?.shared)?raw.shared:[],
    agents:raw?.agents&&typeof raw.agents==="object"?raw.agents:{}
  };
}

export class MemoryStore{
  private cache=new Map<string,RawStore>();

  private file(projectPath:string){
    return path.join(projectPath,".ai-kit","memory","state.json");
  }

  load(projectId:string,projectPath:string){
    if(this.cache.has(projectId))return this.cache.get(projectId)!;
    const file=this.file(projectPath);
    let data:RawStore={shared:[],agents:{}};
    try{data=normalize(JSON.parse(fs.readFileSync(file,"utf8")));}catch{}
    this.cache.set(projectId,data);
    return data;
  }

  save(projectId:string,projectPath:string){
    const data=this.cache.get(projectId)||{shared:[],agents:{}};
    const file=this.file(projectPath);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const tmp=file+".tmp";
    fs.writeFileSync(tmp,JSON.stringify(data,null,2),"utf8");
    fs.renameSync(tmp,file);
  }

  add(projectId:string,projectPath:string,input:{
    scope:"shared"|"agent";
    agentId:string|null;
    kind:MemoryKind;
    title:string;
    body:string;
    tags?:string[];
    relatedTaskId?:string|null;
    relatedArtifactIds?:string[];
    importance?:number;
  }){
    const data=this.load(projectId,projectPath);
    const createdAt=now();
    const row:MemoryRecord={
      id:crypto.randomUUID(),
      projectId,
      scope:input.scope,
      agentId:input.scope==="agent"?(input.agentId||"general"):null,
      kind:input.kind,
      title:input.title,
      body:input.body,
      tags:[...(input.tags||[])],
      relatedTaskId:input.relatedTaskId||null,
      relatedArtifactIds:[...(input.relatedArtifactIds||[])],
      importance:Math.max(0,Math.min(100,Math.floor(input.importance??50))),
      createdAt,
      updatedAt:createdAt,
      lastAccessedAt:null,
      accessCount:0
    };

    if(row.scope==="shared")data.shared.push(row);
    else{
      const key=row.agentId||"general";
      if(!Array.isArray(data.agents[key]))data.agents[key]=[];
      data.agents[key].push(row);
    }
    this.save(projectId,projectPath);
    return row;
  }

  touch(projectId:string,projectPath:string,id:string){
    const data=this.load(projectId,projectPath);
    const all=[...data.shared,...Object.values(data.agents).flat()];
    const row=all.find(x=>x.id===id);
    if(!row)return null;
    row.lastAccessedAt=now();
    row.accessCount=(row.accessCount||0)+1;
    row.updatedAt=now();
    this.save(projectId,projectPath);
    return row;
  }

  snapshot(projectId:string,projectPath:string):MemorySnapshot{
    const data=this.load(projectId,projectPath);
    return {shared:data.shared,agents:data.agents};
  }

  replaceAgentMemories(projectId:string,projectPath:string,agentId:string,rows:MemoryRecord[]){
    const data=this.load(projectId,projectPath);
    data.agents[agentId]=rows;
    this.save(projectId,projectPath);
  }

  replaceShared(projectId:string,projectPath:string,rows:MemoryRecord[]){
    const data=this.load(projectId,projectPath);
    data.shared=rows;
    this.save(projectId,projectPath);
  }
}
