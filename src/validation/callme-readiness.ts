import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {detectCallMeProject} from "./callme-detector";
import {scanProjectDocs} from "../project-intelligence/docs-scanner";

export type CallMeCheck={
  id:string;
  ok:boolean;
  required:boolean;
  message:string;
  evidence?:unknown;
};

function git(projectPath:string,args:string[]){
  try{return String(execFileSync("git",args,{cwd:projectPath,encoding:"utf8",windowsHide:true,maxBuffer:8*1024*1024})).trim();}
  catch{return null;}
}

export function callMeReadiness(projectPath:string){
  const detection=detectCallMeProject(projectPath);
  const checks:CallMeCheck[]=[];

  checks.push({
    id:"project.detect",
    ok:detection.isCallMeCompatible,
    required:true,
    message:detection.isCallMeCompatible?"CallMe Laravel/Inertia project detected":"Project does not match expected CallMe stack",
    evidence:detection
  });

  const insideGit=git(projectPath,["rev-parse","--is-inside-work-tree"])==="true";
  checks.push({
    id:"git.repo",
    ok:insideGit,
    required:true,
    message:insideGit?"Git repository detected":"Git repository required for safe validation"
  });

  const branch=insideGit?git(projectPath,["branch","--show-current"]):null;
  const status=insideGit?git(projectPath,["status","--short"]):null;
  checks.push({
    id:"git.status",
    ok:insideGit,
    required:true,
    message:status?"Working tree has existing changes":"Working tree clean or status unavailable",
    evidence:{branch,status}
  });

  let docs:any=null;
  try{docs=scanProjectDocs(projectPath);}catch{}
  checks.push({
    id:"docs.state",
    ok:Boolean(docs?.progressFile&&docs?.stateFile),
    required:false,
    message:docs?.progressFile&&docs?.stateFile?"PROGRESS and PROJECT_STATE detected":"Project docs/state incomplete",
    evidence:docs?{warnings:docs.warnings,tasks:docs.tasks.length}:null
  });

  const envPresent=fs.existsSync(path.join(projectPath,".env"));
  checks.push({
    id:"env.present",
    ok:envPresent,
    required:false,
    message:envPresent?".env present (will remain protected)":"No .env file detected",
    evidence:{protected:true}
  });

  const requiredFailures=checks.filter(x=>x.required&&!x.ok).length;
  return {
    projectPath,
    ready:requiredFailures===0,
    requiredFailures,
    checks,
    detection
  };
}
