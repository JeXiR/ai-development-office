import type {WorkerConfig} from "@/workers/types";
import {DistributedJobStore} from "./job-store";
import {DistributedScheduler} from "./scheduler";
import {DistributedJobRunner} from "./runner";
import type {DistributedJob} from "./types";

export type DistributedEvent={
  type:"job.output"|"job.state";
  projectId:string;
  jobId:string;
  data:unknown;
};

export class DistributedManager{
  readonly jobs=new DistributedJobStore();
  private scheduler=new DistributedScheduler();
  private runner=new DistributedJobRunner();

  async runNext(projectPath:string,workers:WorkerConfig[],emit:(event:DistributedEvent)=>void){
    const row=this.jobs.list(projectPath).find(x=>x.status==="queued"||x.status==="retrying");
    if(!row)return null;

    const selected=this.scheduler.select(projectPath,workers,row.requiredTags);
    if(!selected)return this.jobs.update(projectPath,row.id,{status:"queued",error:"No matching online worker available."});

    const worker=workers.find(x=>x.id===selected.workerId)!;
    let result=await this.runner.run(projectPath,row,worker,{
      onOutput:(job,chunk)=>emit({type:"job.output",projectId:job.projectId,jobId:job.id,data:{chunk}}),
      onState:job=>emit({type:"job.state",projectId:job.projectId,jobId:job.id,data:job})
    });

    if(result.status==="retrying"){
      const alternatives=workers.filter(x=>x.id!==worker.id);
      const fallback=this.scheduler.select(projectPath,alternatives,row.requiredTags);
      if(fallback){
        const fallbackWorker=alternatives.find(x=>x.id===fallback.workerId)!;
        result=await this.runner.run(projectPath,result,fallbackWorker,{
          onOutput:(job,chunk)=>emit({type:"job.output",projectId:job.projectId,jobId:job.id,data:{chunk}}),
          onState:job=>emit({type:"job.state",projectId:job.projectId,jobId:job.id,data:job})
        });
      }
    }
    return result;
  }

  recover(projectPath:string){return this.jobs.recoverInterrupted(projectPath);}
}
