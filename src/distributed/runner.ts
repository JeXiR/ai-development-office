import {spawn} from "node:child_process";
import type {WorkerConfig} from "@/workers/types";
import {WorkerExecutor} from "@/workers/executor";
import {DistributedJobStore} from "./job-store";
import {DistributedLogStore} from "./log-store";
import type {DistributedJob} from "./types";

export type JobRunHooks={
  onOutput?:(job:DistributedJob,chunk:string)=>void;
  onState?:(job:DistributedJob)=>void;
};

export class DistributedJobRunner{
  private executor=new WorkerExecutor();
  private jobs=new DistributedJobStore();
  private logs=new DistributedLogStore();

  async run(projectPath:string,job:DistributedJob,worker:WorkerConfig,hooks:JobRunHooks={}){
    const attempt=job.attempt+1;
    const started=new Date().toISOString();
    const running=this.jobs.update(projectPath,job.id,{
      workerId:worker.id,status:"running",attempt,startedAt:started,finishedAt:null,error:null
    })!;
    hooks.onState?.(running);

    const command=this.executor.buildCommand({...worker,workdir:job.cwd||worker.workdir},job.command);
    const logFile=this.logs.file(projectPath,job.id);
    this.jobs.update(projectPath,job.id,{logFile});

    return await new Promise<DistributedJob>(resolve=>{
      const child=spawn(command.executable,command.args,{
        cwd:worker.kind==="local"?(job.cwd||projectPath):undefined,
        env:process.env,
        windowsHide:true,
        shell:false
      });

      const push=(chunk:any)=>{
        const text=String(chunk);
        this.logs.append(projectPath,job.id,text);
        hooks.onOutput?.(running,text);
      };
      child.stdout?.on("data",push);
      child.stderr?.on("data",push);

      child.on("error",error=>{
        push(`\n[runner-error] ${error.message}\n`);
      });

      child.on("close",exitCode=>{
        const latest=this.jobs.list(projectPath).find(x=>x.id===job.id)!;
        const ok=exitCode===0;
        const canRetry=!ok&&latest.attempt<latest.maxAttempts;
        const updated=this.jobs.update(projectPath,job.id,{
          status:ok?"completed":canRetry?"retrying":"failed",
          finishedAt:new Date().toISOString(),
          exitCode:exitCode??-1,
          error:ok?null:`Worker process exited with code ${exitCode??-1}`
        })!;
        hooks.onState?.(updated);
        resolve(updated);
      });
    });
  }
}
