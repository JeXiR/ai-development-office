import fs from "node:fs";
import path from "node:path";
import type {MissionExecutionEvent} from "./execution-types";

export class MissionEventJournal{
  constructor(private readonly dataDir:string){}
  private file(){return path.join(this.dataDir,"mission-events.jsonl");}
  append(event:MissionExecutionEvent){
    fs.mkdirSync(this.dataDir,{recursive:true});
    fs.appendFileSync(this.file(),JSON.stringify(event)+"\n","utf8");
  }
  forMission(missionId:string){
    try{
      return fs.readFileSync(this.file(),"utf8").trim().split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x)).filter((e:any)=>e.missionId===missionId);
    }catch{return [];}
  }
}
