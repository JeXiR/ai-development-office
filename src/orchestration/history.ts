import fs from "node:fs";
import path from "node:path";
import type {MissionExecutionSummary} from "./execution-types";

export type MissionHistoryRecord={
  missionId:string;
  goal:string;
  projectId:string;
  status:string;
  startedAt:string;
  completedAt:string|null;
  result:unknown;
  errors:string[];
  providerSummary:Array<{agentId:string;providerId:string|null;attempts:number;ok:boolean}>;
};

export class MissionHistoryStore{
  constructor(private readonly dataDir:string){}
  private file(){return path.join(this.dataDir,"mission-history.jsonl");}

  append(record:MissionHistoryRecord){
    fs.mkdirSync(this.dataDir,{recursive:true});
    fs.appendFileSync(this.file(),JSON.stringify(record)+"\n","utf8");
  }

  recent(limit=100):MissionHistoryRecord[]{
    try{
      const lines=fs.readFileSync(this.file(),"utf8").trim().split(/\r?\n/).filter(Boolean);
      return lines.slice(-limit).map(x=>JSON.parse(x));
    }catch{return [];}
  }

  find(missionId:string){
    return this.recent(1000).find(x=>x.missionId===missionId)||null;
  }
}
