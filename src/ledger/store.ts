import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {LedgerEntry,LedgerSummary} from "./types";

function now(){return new Date().toISOString();}

export class LedgerStore{
  private file(projectPath:string){
    return path.join(projectPath,".ai-kit","telemetry","ledger.json");
  }

  load(projectPath:string):LedgerEntry[]{
    try{
      const raw=JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"));
      return Array.isArray(raw)?raw:[];
    }catch{return [];}
  }

  save(projectPath:string,rows:LedgerEntry[]){
    const file=this.file(projectPath);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const tmp=file+".tmp";
    fs.writeFileSync(tmp,JSON.stringify(rows.slice(-10000),null,2),"utf8");
    fs.renameSync(tmp,file);
  }

  add(projectId:string,projectPath:string,input:Omit<LedgerEntry,"id"|"projectId"|"createdAt"|"totalTokens">){
    const rows=this.load(projectPath);
    const entry:LedgerEntry={
      ...input,
      id:crypto.randomUUID(),
      projectId,
      totalTokens:Math.max(0,input.inputTokens)+Math.max(0,input.outputTokens),
      createdAt:now()
    };
    rows.push(entry);
    this.save(projectPath,rows);
    return entry;
  }

  summary(projectPath:string):LedgerSummary{
    const rows=this.load(projectPath);
    const byProvider:LedgerSummary["byProvider"]={};
    for(const row of rows){
      const bucket=byProvider[row.provider]||{entries:0,tokens:0,costUsd:0,avgLatencyMs:null as number|null};
      bucket.entries++;
      bucket.tokens+=row.totalTokens;
      bucket.costUsd+=row.estimatedCostUsd;
      const latencies=rows.filter(x=>x.provider===row.provider&&typeof x.latencyMs==="number").map(x=>x.latencyMs as number);
      bucket.avgLatencyMs=latencies.length?Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length):null;
      byProvider[row.provider]=bucket;
    }
    return {
      entries:rows.length,
      totalTokens:rows.reduce((n,x)=>n+x.totalTokens,0),
      totalCostUsd:rows.reduce((n,x)=>n+x.estimatedCostUsd,0),
      byProvider
    };
  }
}
