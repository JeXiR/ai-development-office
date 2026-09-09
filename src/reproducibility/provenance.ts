import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type ProvenanceEvent={
  id:string;
  projectId:string;
  type:"execution"|"artifact"|"state"|"git"|"runtime";
  actor:string;
  action:string;
  sourceTaskId:string|null;
  sourceSessionId:string|null;
  artifactPath:string|null;
  metadata:Record<string,unknown>;
  createdAt:string;
};

export class ProvenanceStore{
  private file(projectPath:string){
    return path.join(projectPath,".ai-kit","provenance","events.jsonl");
  }

  append(projectId:string,projectPath:string,input:Omit<ProvenanceEvent,"id"|"projectId"|"createdAt">){
    const file=this.file(projectPath);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const event:ProvenanceEvent={
      ...input,id:crypto.randomUUID(),projectId,createdAt:new Date().toISOString()
    };
    fs.appendFileSync(file,JSON.stringify(event)+"\n","utf8");
    return event;
  }

  list(projectPath:string,limit=500){
    const file=this.file(projectPath);
    if(!fs.existsSync(file))return [] as ProvenanceEvent[];
    const lines=fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean);
    return lines.slice(-Math.max(1,Math.min(5000,limit))).map(line=>{
      try{return JSON.parse(line) as ProvenanceEvent;}catch{return null;}
    }).filter((x):x is ProvenanceEvent=>!!x);
  }

  replay(projectPath:string,handler:(event:ProvenanceEvent)=>void,limit=5000){
    const events=this.list(projectPath,limit);
    for(const event of events)handler(event);
    return {replayed:events.length};
  }
}
