import fs from "node:fs";
import path from "node:path";
import type {UniversalProviderId} from "./types";

export type ProviderQualityRecord={
  providerId:UniversalProviderId;
  taskType:string;
  score:number;
  latencyMs:number|null;
  ok:boolean;
  at:string;
};

type Aggregate={
  count:number;
  avgScore:number;
  successRate:number;
  avgLatencyMs:number|null;
};

export class ProviderQualityStore{
  constructor(private readonly dataDir:string){}
  private file(){return path.join(this.dataDir,"provider-quality.jsonl");}

  append(record:ProviderQualityRecord){
    fs.mkdirSync(this.dataDir,{recursive:true});
    fs.appendFileSync(this.file(),JSON.stringify(record)+"\n","utf8");
  }

  records(limit=1000):ProviderQualityRecord[]{
    try{
      const lines=fs.readFileSync(this.file(),"utf8").trim().split(/\r?\n/).filter(Boolean);
      return lines.slice(-limit).map(x=>JSON.parse(x));
    }catch{return [];}
  }

  aggregate(providerId:UniversalProviderId,taskType?:string):Aggregate{
    const rows=this.records().filter(x=>x.providerId===providerId&&(!taskType||x.taskType===taskType));
    if(!rows.length)return {count:0,avgScore:0,successRate:0,avgLatencyMs:null};
    const scored=rows.map(x=>x.score);
    const lat=rows.map(x=>x.latencyMs).filter((x):x is number=>typeof x==="number");
    return {
      count:rows.length,
      avgScore:scored.reduce((a,b)=>a+b,0)/scored.length,
      successRate:rows.filter(x=>x.ok).length/rows.length,
      avgLatencyMs:lat.length?lat.reduce((a,b)=>a+b,0)/lat.length:null
    };
  }

  routingBonus(providerId:UniversalProviderId,taskType?:string){
    const agg=this.aggregate(providerId,taskType);
    if(!agg.count)return 0;
    return Math.round((agg.avgScore-0.5)*20+(agg.successRate-0.5)*20);
  }
}
