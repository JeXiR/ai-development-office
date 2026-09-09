import type {WorkerConfig} from "@/workers/types";
import type {WorkerCapability} from "./types";
import {WorkerExecutor} from "@/workers/executor";
import {DistributedJobStore} from "./job-store";

export class DistributedScheduler{
  private executor=new WorkerExecutor();
  private jobs=new DistributedJobStore();

  capabilities(projectPath:string,workers:WorkerConfig[]):WorkerCapability[]{
    return workers.map(worker=>{
      const state=this.executor.check(worker);
      const activeJobs=this.jobs.activeCount(projectPath,worker.id);
      const online=state.status==="online"&&worker.enabled;
      const load=Math.min(1,activeJobs/Math.max(1,worker.maxConcurrent));
      const score=(online?100:0)-load*70+(worker.kind==="local"?5:0);
      return {workerId:worker.id,kind:worker.kind,tags:[...worker.tags],maxConcurrent:worker.maxConcurrent,activeJobs,online,score:Number(score.toFixed(2))};
    });
  }

  select(projectPath:string,workers:WorkerConfig[],requiredTags:string[]){
    const caps=this.capabilities(projectPath,workers)
      .filter(x=>x.online&&x.activeJobs<x.maxConcurrent)
      .filter(x=>!requiredTags.length||requiredTags.every(tag=>x.tags.includes(tag)))
      .sort((a,b)=>b.score-a.score);
    return caps[0]||null;
  }
}
