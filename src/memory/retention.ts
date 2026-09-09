import crypto from "node:crypto";
import type {MemoryRecord} from "./types";

function now(){return new Date().toISOString();}

export class MemoryRetention{
  condense(rows:MemoryRecord[],maxItems=80){
    if(rows.length<=maxItems)return {rows,condensed:false};

    const sorted=[...rows].sort((a,b)=>{
      const sa=b.importance-a.importance;
      if(sa!==0)return sa;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

    const keep=sorted.slice(0,Math.max(10,maxItems-1));
    const compact=sorted.slice(Math.max(10,maxItems-1));

    const summaryBody=compact
      .slice(0,40)
      .map(x=>`- [${x.kind}] ${x.title}: ${x.body.slice(0,180)}`)
      .join("\n");

    const stamp=now();
    const summary:MemoryRecord={
      id:crypto.randomUUID(),
      projectId:rows[0]?.projectId||"",
      scope:rows[0]?.scope||"shared",
      agentId:rows[0]?.agentId||null,
      kind:"summary",
      title:`Condensed memory (${compact.length} records)`,
      body:summaryBody,
      tags:["condensed","retention"],
      relatedTaskId:null,
      relatedArtifactIds:[],
      importance:65,
      createdAt:stamp,
      updatedAt:stamp,
      lastAccessedAt:null,
      accessCount:0
    };

    return {rows:[...keep,summary],condensed:true};
  }

  prune(rows:MemoryRecord[],retentionDays=180){
    const cutoff=Date.now()-Math.max(1,retentionDays)*24*60*60*1000;
    return rows.filter(row=>{
      if(row.importance>=80)return true;
      const at=Date.parse(row.updatedAt||row.createdAt);
      return !Number.isFinite(at)||at>=cutoff;
    });
  }
}
