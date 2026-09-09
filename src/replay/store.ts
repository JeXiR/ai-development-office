import fs from "node:fs";
import path from "node:path";
import type {RuntimeEvent} from "@/runtime/types";
import type {SessionReplay,SessionReplayEvent} from "./types";

export class SessionReplayStore{
  private file(projectPath:string,sessionId:string){
    return path.join(projectPath,".ai-kit","replay","sessions",`${sessionId}.jsonl`);
  }

  append(projectPath:string,event:RuntimeEvent){
    const file=this.file(projectPath,event.sessionId);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const row:SessionReplayEvent={
      id:event.id,
      sessionId:event.sessionId,
      projectId:event.projectId,
      agentId:event.agentId,
      type:event.type,
      timestamp:event.timestamp,
      payload:event.payload
    };
    fs.appendFileSync(file,JSON.stringify(row)+"\n","utf8");
  }

  read(projectPath:string,sessionId:string):SessionReplay{
    const file=this.file(projectPath,sessionId);
    if(!fs.existsSync(file))return {sessionId,projectId:"",events:[]};
    const events=fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(line=>{
      try{return JSON.parse(line) as SessionReplayEvent;}catch{return null;}
    }).filter((x):x is SessionReplayEvent=>!!x);
    return {sessionId,projectId:events[0]?.projectId||"",events};
  }

  list(projectPath:string){
    const dir=path.join(projectPath,".ai-kit","replay","sessions");
    if(!fs.existsSync(dir))return [];
    return fs.readdirSync(dir).filter(x=>x.endsWith(".jsonl")).map(x=>x.replace(/\.jsonl$/,""));
  }
}
