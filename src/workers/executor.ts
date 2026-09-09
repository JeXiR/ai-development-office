import {spawnSync} from "node:child_process";
import type {WorkerConfig,WorkerRuntimeState} from "./types";

export class WorkerExecutor{
  check(worker:WorkerConfig):WorkerRuntimeState{
    const at=new Date().toISOString();
    if(!worker.enabled)return {config:worker,status:"offline",activeJobs:0,lastCheckAt:at,message:"Disabled"};
    try{
      if(worker.kind==="local"){
        return {config:worker,status:"online",activeJobs:0,lastCheckAt:at,message:"Local worker ready"};
      }
      if(worker.kind==="ssh"){
        if(!worker.host)throw new Error("SSH host missing.");
        const target=worker.user?`${worker.user}@${worker.host}`:worker.host;
        const args=["-o","BatchMode=yes","-o","ConnectTimeout=4"];
        if(worker.port)args.push("-p",String(worker.port));
        args.push(target,"echo OFFICE_WORKER_OK");
        const r=spawnSync("ssh",args,{encoding:"utf8",timeout:7000,windowsHide:true});
        const ok=String(r.stdout||"").includes("OFFICE_WORKER_OK");
        return {config:worker,status:ok?"online":"offline",activeJobs:0,lastCheckAt:at,message:ok?"SSH worker ready":String(r.stderr||"SSH check failed").trim().slice(0,500)};
      }
      if(worker.kind==="docker"){
        if(!worker.container)throw new Error("Docker container missing.");
        const r=spawnSync("docker",["exec",worker.container,"sh","-lc","echo OFFICE_WORKER_OK"],{encoding:"utf8",timeout:7000,windowsHide:true});
        const ok=String(r.stdout||"").includes("OFFICE_WORKER_OK");
        return {config:worker,status:ok?"online":"offline",activeJobs:0,lastCheckAt:at,message:ok?"Docker worker ready":String(r.stderr||"Docker check failed").trim().slice(0,500)};
      }
      return {config:worker,status:"unknown",activeJobs:0,lastCheckAt:at,message:"Unknown worker kind"};
    }catch(error){
      return {config:worker,status:"offline",activeJobs:0,lastCheckAt:at,message:error instanceof Error?error.message:String(error)};
    }
  }

  buildCommand(worker:WorkerConfig,command:string){
    if(worker.kind==="local")return {executable:process.platform==="win32"?"cmd.exe":"/bin/sh",args:process.platform==="win32"?["/d","/s","/c",command]:["-lc",command]};
    if(worker.kind==="ssh"){
      if(!worker.host)throw new Error("SSH host missing.");
      const target=worker.user?`${worker.user}@${worker.host}`:worker.host;
      const args:string[]=[];
      if(worker.port)args.push("-p",String(worker.port));
      args.push(target,worker.workdir?`cd ${JSON.stringify(worker.workdir)} && ${command}`:command);
      return {executable:"ssh",args};
    }
    if(worker.kind==="docker"){
      if(!worker.container)throw new Error("Docker container missing.");
      return {executable:"docker",args:["exec",worker.container,"sh","-lc",worker.workdir?`cd ${JSON.stringify(worker.workdir)} && ${command}`:command]};
    }
    throw new Error("Unsupported worker.");
  }
}
