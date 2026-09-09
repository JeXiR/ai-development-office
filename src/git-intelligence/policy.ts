import fs from "node:fs";
import path from "node:path";
import {atomicWriteJson} from "@/recovery/atomic-write";
import type {AutoGitPolicy} from "./types";

export const DEFAULT_AUTO_GIT_POLICY:AutoGitPolicy={
  autoBranch:false,
  autoCommit:false,
  branchPrefix:"office/",
  commitPrefix:"office:",
  requireCleanBase:true
};

export class AutoGitPolicyStore{
  private file(projectPath:string){return path.join(projectPath,".ai-kit","git","policy.json");}
  load(projectPath:string):AutoGitPolicy{
    try{return {...DEFAULT_AUTO_GIT_POLICY,...JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"))};}
    catch{return {...DEFAULT_AUTO_GIT_POLICY};}
  }
  save(projectPath:string,policy:AutoGitPolicy){atomicWriteJson(this.file(projectPath),policy);return policy;}
}
