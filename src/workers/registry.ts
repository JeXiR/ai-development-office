import fs from "node:fs";
import path from "node:path";
import {atomicWriteJson} from "@/recovery/atomic-write";
import type {WorkerConfig} from "./types";

export class WorkerRegistry{
  private file(projectPath:string){return path.join(projectPath,".ai-kit","workers","workers.json");}

  list(projectPath:string):WorkerConfig[]{
    try{
      const raw=JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"));
      return Array.isArray(raw)?raw:[];
    }catch{return [];}
  }

  save(projectPath:string,rows:WorkerConfig[]){atomicWriteJson(this.file(projectPath),rows);}

  upsert(projectPath:string,row:WorkerConfig){
    if(!/^[A-Za-z0-9._-]{1,80}$/.test(row.id))throw new Error("Invalid worker id.");
    const rows=this.list(projectPath);
    const i=rows.findIndex(x=>x.id===row.id);
    if(i>=0)rows[i]=row;else rows.push(row);
    this.save(projectPath,rows);
    return row;
  }

  remove(projectPath:string,id:string){
    this.save(projectPath,this.list(projectPath).filter(x=>x.id!==id));
    return true;
  }
}
