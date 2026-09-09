import type {WorkerConfig,WorkerRuntimeState} from "./types";
import {WorkerExecutor} from "./executor";

export class WorkerPool{
  private executor=new WorkerExecutor();

  states(rows:WorkerConfig[]){
    return rows.map(row=>this.executor.check(row));
  }

  select(rows:WorkerConfig[],tags:string[]=[]){
    const states=this.states(rows).filter(x=>x.status==="online"&&x.config.enabled);
    const candidates=states.filter(x=>!tags.length||tags.every(tag=>x.config.tags.includes(tag)));
    return (candidates.length?candidates:states)
      .sort((a,b)=>(a.activeJobs/a.config.maxConcurrent)-(b.activeJobs/b.config.maxConcurrent))[0]||null;
  }
}
