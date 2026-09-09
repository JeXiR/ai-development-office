import fs from "node:fs";
import path from "node:path";
import type {UniversalProviderId} from "./types";

export type ProviderTelemetryRecord={
  at:string;
  missionId:string|null;
  agentId:string|null;
  providerId:UniversalProviderId;
  model:string|null;
  latencyMs:number|null;
  inputTokens:number|null;
  outputTokens:number|null;
  costUsd:number|null;
  ok:boolean;
  error:string|null;
};

export class ProviderTelemetryLedger{
  constructor(private readonly dataDir:string){}
  private file(){return path.join(this.dataDir,"provider-telemetry.jsonl");}
  append(record:ProviderTelemetryRecord){
    fs.mkdirSync(this.dataDir,{recursive:true});
    fs.appendFileSync(this.file(),JSON.stringify(record)+"\n","utf8");
  }
  recent(limit=100){
    try{
      const lines=fs.readFileSync(this.file(),"utf8").trim().split(/\r?\n/).filter(Boolean);
      return lines.slice(-limit).map(x=>JSON.parse(x));
    }catch{return [];}
  }
}
