import fs from "node:fs";
import path from "node:path";
import {atomicWriteJson} from "@/recovery/atomic-write";
import type {AgentQualityScore} from "./types";
import type {LedgerEntry} from "@/ledger/types";

export class AgentScoringService{
  score(projectPath:string,ledger:LedgerEntry[],agentId:string,role:string):AgentQualityScore{
    const rows=ledger.filter(x=>x.agentId===agentId);
    const completed=rows.length;
    const failed=rows.filter(x=>Number((x as any).metadata?.failed||0)>0).length;
    const retries=rows.filter(x=>Number((x as any).metadata?.retry||0)>0).length;
    const durations=rows.map(x=>x.durationMs).filter((x):x is number=>typeof x==="number");
    const costs=rows.map(x=>x.estimatedCostUsd).filter((x):x is number=>typeof x==="number");

    const successRate=completed?Math.max(0,(completed-failed)/completed):0.5;
    const retryPenalty=completed?Math.min(0.3,retries/completed*0.2):0;
    const quality=Math.max(0,Math.min(100,Math.round((successRate-retryPenalty)*100)));
    const trust=Math.max(0,Math.min(100,Math.round(quality*0.8+(completed?Math.min(20,completed):5))));

    const score:AgentQualityScore={
      agentId,role,completed,failed,retries,
      avgDurationMs:durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length):null,
      avgCostUsd:costs.length?Number((costs.reduce((a,b)=>a+b,0)/costs.length).toFixed(6)):null,
      quality,trust,
      specialties:this.specialties(projectPath,agentId),
      updatedAt:new Date().toISOString()
    };
    this.persist(projectPath,score);
    return score;
  }

  private file(projectPath:string){
    return path.join(projectPath,".ai-kit","autonomy","agent-scores.json");
  }

  private specialties(projectPath:string,agentId:string){
    const file=path.join(projectPath,".ai-kit","memory","state.json");
    try{
      const raw=JSON.parse(fs.readFileSync(file,"utf8"));
      const payload=raw?.payload??raw;
      const rows=Array.isArray(payload?.records)?payload.records:[];
      const tags=new Map<string,number>();
      for(const r of rows){
        if(r?.agentId!==agentId)continue;
        for(const tag of Array.isArray(r.tags)?r.tags:[])tags.set(tag,(tags.get(tag)||0)+1);
      }
      return [...tags.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
    }catch{return [];}
  }

  persist(projectPath:string,score:AgentQualityScore){
    let rows:AgentQualityScore[]=[];
    try{rows=JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"));}catch{}
    const i=rows.findIndex(x=>x.agentId===score.agentId);
    if(i>=0)rows[i]=score;else rows.push(score);
    atomicWriteJson(this.file(projectPath),rows);
  }

  list(projectPath:string):AgentQualityScore[]{
    try{
      const rows=JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"));
      return Array.isArray(rows)?rows:[];
    }catch{return [];}
  }
}
