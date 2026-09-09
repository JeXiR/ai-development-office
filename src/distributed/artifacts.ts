import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import type {WorkerConfig} from "@/workers/types";
import type {ArtifactTransferResult} from "./types";

export class ArtifactTransferService{
  pull(worker:WorkerConfig,remotePath:string,localPath:string):ArtifactTransferResult{
    fs.mkdirSync(path.dirname(localPath),{recursive:true});
    if(worker.kind==="local"){
      fs.copyFileSync(remotePath,localPath);
      return {ok:true,source:remotePath,destination:localPath,bytes:fs.statSync(localPath).size,message:"Local artifact copied."};
    }

    if(worker.kind==="ssh"){
      if(!worker.host)throw new Error("SSH host missing.");
      const target=worker.user?`${worker.user}@${worker.host}`:worker.host;
      const args:string[]=[];
      if(worker.port)args.push("-P",String(worker.port));
      args.push(`${target}:${remotePath}`,localPath);
      const r=spawnSync("scp",args,{encoding:"utf8",timeout:60000,windowsHide:true});
      const ok=r.status===0;
      return {ok,source:remotePath,destination:localPath,bytes:ok&&fs.existsSync(localPath)?fs.statSync(localPath).size:0,message:ok?"SSH artifact copied.":String(r.stderr||"scp failed").trim()};
    }

    if(worker.kind==="docker"){
      if(!worker.container)throw new Error("Docker container missing.");
      const r=spawnSync("docker",["cp",`${worker.container}:${remotePath}`,localPath],{encoding:"utf8",timeout:60000,windowsHide:true});
      const ok=r.status===0;
      return {ok,source:remotePath,destination:localPath,bytes:ok&&fs.existsSync(localPath)?fs.statSync(localPath).size:0,message:ok?"Docker artifact copied.":String(r.stderr||"docker cp failed").trim()};
    }

    return {ok:false,source:remotePath,destination:localPath,bytes:0,message:"Unsupported worker kind."};
  }
}
