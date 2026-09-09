import {execFileSync} from "node:child_process";

function git(projectRoot:string,args:string[]){
  try{
    return String(execFileSync("git",args,{cwd:projectRoot,encoding:"utf8",windowsHide:true,maxBuffer:8*1024*1024}));
  }catch(error:any){
    const stderr=String(error?.stderr||error?.message||error);
    throw new Error(stderr.trim()||`git ${args.join(" ")} failed`);
  }
}

export function projectGitStatus(projectRoot:string){
  return git(projectRoot,["status","--short"]);
}

export function projectGitTrackedStatus(projectRoot:string){
  return git(projectRoot,["status","--short","--untracked-files=no"]);
}

export function projectGitTrackedDiff(projectRoot:string){
  return git(projectRoot,["diff","--binary","--no-ext-diff"]);
}

export function projectGitStagedDiff(projectRoot:string){
  return git(projectRoot,["diff","--cached","--binary","--no-ext-diff"]);
}

export function projectGitTrackedFingerprint(projectRoot:string){
  const crypto=require("node:crypto");
  const payload=[
    "WORKTREE",
    projectGitTrackedDiff(projectRoot),
    "INDEX",
    projectGitStagedDiff(projectRoot)
  ].join("\n");
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function projectGitDiff(projectRoot:string){
  return git(projectRoot,["diff","--binary","--no-ext-diff"]);
}

export function projectGitHead(projectRoot:string){
  try{return git(projectRoot,["rev-parse","HEAD"]).trim();}catch{return null;}
}

export function projectGitBranch(projectRoot:string){
  try{return git(projectRoot,["branch","--show-current"]).trim();}catch{return null;}
}
