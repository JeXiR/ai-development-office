import path from "node:path";
import {LocalHashEmbeddingProvider,cosineSimilarity,type EmbeddingProvider} from "./embeddings";
import {JsonVectorStore} from "./vector-store";
import {MemoryV2Store} from "./store";
import type {MemorySearchHit,MemorySearchInput,MemoryV2Record} from "./types";

function terms(text:string){
  return new Set((text.toLowerCase().match(/[a-z0-9_./-]+/g)||[]).filter(x=>x.length>1));
}

function lexical(query:string,row:MemoryV2Record){
  const q=terms(query),body=terms(`${row.title} ${row.body} ${row.tags.join(" ")}`);
  if(!q.size)return 0;
  let hit=0;for(const t of q)if(body.has(t))hit++;
  return hit/q.size;
}

export class MemoryV2Service{
  readonly store=new MemoryV2Store();
  constructor(private readonly embeddings:EmbeddingProvider=new LocalHashEmbeddingProvider()){}

  private vectors(projectPath:string){
    return new JsonVectorStore(path.join(projectPath,".ai-kit","memory-v2","vectors.json"));
  }

  async add(projectId:string,projectPath:string,input:Parameters<MemoryV2Store["add"]>[2]){
    const embedding=await this.embeddings.embed(`${input.title}\n${input.body}\n${(input.tags||[]).join(" ")}`);
    const record=this.store.add(projectId,projectPath,{...input,embedding,embeddingModel:this.embeddings.model});
    this.vectors(projectPath).upsert({id:record.id,vector:embedding,metadata:{category:record.category,scope:record.scope,agentId:record.agentId,taskId:record.taskId}});
    return record;
  }

  async search(projectPath:string,input:MemorySearchInput):Promise<MemorySearchHit[]>{
    const rows=this.store.list(projectPath).filter(x=>
      (!input.agentId||x.scope==="shared"||x.agentId===input.agentId) &&
      (!input.taskId||x.taskId===input.taskId||x.scope==="shared") &&
      (!input.categories?.length||input.categories.includes(x.category))
    );
    const qv=await this.embeddings.embed(input.query);
    const hits=rows.map(record=>{
      const lexicalScore=lexical(input.query,record);
      const semanticScore=cosineSimilarity(qv,record.embedding);
      const importanceBoost=record.importance*0.08+record.confidence*0.05+Math.min(0.05,record.accessCount/200);
      const score=semanticScore*0.62+lexicalScore*0.25+importanceBoost;
      return {record,score,lexicalScore,semanticScore};
    }).sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.min(50,input.limit??10)));
    for(const hit of hits)this.store.touch(projectPath,hit.record.id);
    return hits;
  }

  async crossAgentRecall(projectPath:string,query:string,requestingAgent:string,limit=12){
    return this.search(projectPath,{query,agentId:requestingAgent,limit});
  }

  architectureContext(projectPath:string,query:string){
    return this.search(projectPath,{query,categories:["architecture","decision","lesson","warning"],limit:20});
  }

  prune(projectPath:string){return this.store.prune(projectPath);}
}
