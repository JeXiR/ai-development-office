import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";

export type MissionWorkspace={
  mode:"worktree"|"direct";
  path:string;
  branch:string|null;
  cleanup:()=>void;
};

export function createMissionWorkspace(projectRoot:string,missionId:string):MissionWorkspace{
  const safeId=missionId.replace(/[^a-zA-Z0-9_-]/g,"").slice(0,40)||"mission";
  try{
    execFileSync("git",["rev-parse","--is-inside-work-tree"],{cwd:projectRoot,stdio:"ignore",windowsHide:true});
    const base=path.join(os.tmpdir(),"ai-development-office-worktrees");
    fs.mkdirSync(base,{recursive:true});
    const target=path.join(base,safeId);
    if(fs.existsSync(target))fs.rmSync(target,{recursive:true,force:true});
    const branch=`office/${safeId}`;
    execFileSync("git",["worktree","add","-b",branch,target,"HEAD"],{cwd:projectRoot,stdio:"ignore",windowsHide:true});
    return {
      mode:"worktree",
      path:target,
      branch,
      cleanup:()=>{
        try{execFileSync("git",["worktree","remove","--force",target],{cwd:projectRoot,stdio:"ignore",windowsHide:true});}catch{}
      }
    };
  }catch{
    return {mode:"direct",path:projectRoot,branch:null,cleanup:()=>{}};
  }
}
