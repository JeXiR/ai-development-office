import fs from "node:fs";
import path from "node:path";
import type {UnifiedOfficeEvent} from "./event-normalizer";

export class IntegrationJournal{
  constructor(private readonly dataDir:string){}
  private file(){return path.join(this.dataDir,"integration-events.jsonl");}

  append(event:UnifiedOfficeEvent){
    fs.mkdirSync(this.dataDir,{recursive:true});
    fs.appendFileSync(this.file(),JSON.stringify(event)+"\n","utf8");
  }

  recent(limit=200){
    try{
      const rows=fs.readFileSync(this.file(),"utf8").trim().split(/\r?\n/).filter(Boolean);
      return rows.slice(-limit).map(x=>JSON.parse(x));
    }catch{return [];}
  }
}
