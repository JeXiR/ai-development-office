import {MemoryStore} from "./store";
import {MemorySearchEngine} from "./search";
import {MemoryRetention} from "./retention";
import type {MemoryKind,MemoryRecord} from "./types";

export class MemoryService{
  readonly store=new MemoryStore();
  readonly searchEngine=new MemorySearchEngine();
  readonly retention=new MemoryRetention();

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
    return this.store.add(projectId,projectPath,input);
  }

  snapshot(projectId:string,projectPath:string){
    return this.store.snapshot(projectId,projectPath);
  }

  search(projectId:string,projectPath:string,query:string,agentId?:string|null,limit=12){
    const snapshot=this.snapshot(projectId,projectPath);
    const memories:MemoryRecord[]=[
      ...snapshot.shared,
      ...(agentId?snapshot.agents[agentId]||[]:Object.values(snapshot.agents).flat())
    ];
    const results=this.searchEngine.search(memories,query,limit);
    for(const result of results)this.store.touch(projectId,projectPath,result.memory.id);
    return results;
  }

  condense(projectId:string,projectPath:string,maxItems=80,retentionDays=180){
    const snapshot=this.snapshot(projectId,projectPath);
    const shared=this.retention.condense(this.retention.prune(snapshot.shared,retentionDays),maxItems);
    this.store.replaceShared(projectId,projectPath,shared.rows);

    const agents:Record<string,{before:number;after:number;condensed:boolean}>={};
    for(const [agentId,rows] of Object.entries(snapshot.agents)){
      const pruned=this.retention.prune(rows,retentionDays);
      const compact=this.retention.condense(pruned,maxItems);
      this.store.replaceAgentMemories(projectId,projectPath,agentId,compact.rows);
      agents[agentId]={before:rows.length,after:compact.rows.length,condensed:compact.condensed};
    }

    return {
      shared:{before:snapshot.shared.length,after:shared.rows.length,condensed:shared.condensed},
      agents
    };
  }

  directorContext(projectId:string,projectPath:string,goal:string){
    const results=this.search(projectId,projectPath,goal,null,10);
    return results.map(x=>({
      id:x.memory.id,
      scope:x.memory.scope,
      agentId:x.memory.agentId,
      kind:x.memory.kind,
      title:x.memory.title,
      body:x.memory.body,
      score:x.score
    }));
  }
}
