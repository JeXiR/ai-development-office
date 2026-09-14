import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type MergeMethod="none"|"squash"|"patch"|"mixed";

export type FactoryMergeSession={
  repo:string;
  baseSha:string;
  method:MergeMethod;
  patchFiles:string[];
};

export type GitOk={ok:true;stdout:string;stderr:string};
export type GitErr={ok:false;stdout:string;stderr:string;error:string};

const IDENTITY=["-c","user.name=AI Development Office","-c","user.email=office@localhost"];

export function isFactoryKitPath(file:string){
  const n=file.replace(/\\/g,"/").replace(/^\.\//,"");
  return n==="PROGRESS.md"
    || n==="docs/ROADMAP.md"
    || n==="docs/PROJECT_STATE.md"
    || n==="docs/office-mission-log.md"
    || n.startsWith(".ai-kit/")
    || n.startsWith("ai-kit/")
    || n===".ai-kit"
    || n==="ai-kit";
}

export function isProductSourcePath(file:string){
  const n=file.replace(/\\/g,"/").replace(/^\.\//,"");
  return /^(app|database|tests|resources|lang|config|public|routes|src|bootstrap)\//.test(n)
    || /^(phpunit\.xml(?:\.dist)?)$/.test(n);
}

function git(cwd:string, args:string[], timeout=30000){
  try{
    const r=spawnSync("git",["-c","core.safecrlf=false",...args],{
      cwd,
      encoding:"utf8",
      windowsHide:true,
      timeout,
      env:{...process.env,GIT_OPTIONAL_LOCKS:"0"}
    });
    const stdout=String(r.stdout||"").trim();
    const stderr=String(r.stderr||"").trim();
    if(r.status===0)return {ok:true as const, stdout, stderr};
    return {ok:false as const, stdout, stderr, error:stderr||stdout||`git ${args[0]} failed`};
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    return {ok:false as const, stdout:"", stderr:message, error:message};
  }
}

export function headSha(repo:string){
  const r=git(repo,["rev-parse","HEAD"],8000);
  return r.ok?r.stdout:null;
}

export function beginFactoryMerge(repo:string):FactoryMergeSession|GitErr{
  const sha=headSha(repo);
  if(!sha)return {ok:false, stdout:"", stderr:"", error:"Repository has no HEAD; cannot squash-merge."};
  return {repo, baseSha:sha, method:"none", patchFiles:[]};
}

export function commitWorktree(worktree:string, message:string){
  git(worktree,["add","-A"],20000);
  const dirty=git(worktree,["status","--porcelain"],8000);
  if(!dirty.ok)return {ok:false as const, committed:false, error:dirty.error};
  if(!dirty.stdout.trim())return {ok:true as const, committed:false, error:""};
  const committed=git(worktree,[...IDENTITY,"commit","--no-gpg-sign","-m",message],20000);
  if(!committed.ok)return {ok:false as const, committed:false, error:committed.error};
  return {ok:true as const, committed:true, error:""};
}

export function squashBranch(repo:string, branch:string){
  if(!branch.trim())return {ok:false as const, error:"Missing branch"};
  const merged=git(repo,["merge","--squash","--no-commit",branch],30000);
  if(!merged.ok){
    git(repo,["merge","--abort"],8000);
    git(repo,["reset","--merge"],8000);
    return {ok:false as const, error:merged.error};
  }
  return {ok:true as const, error:""};
}

export function abortFactoryMerge(session:FactoryMergeSession){
  const reset=git(session.repo,["reset","--hard",session.baseSha],20000);
  if(!reset.ok)return {ok:false as const, error:reset.error};
  session.method="none";
  return {ok:true as const, error:""};
}

function skipUntracked(repo:string, file:string){
  const n=file.replace(/\\/g,"/").replace(/\/$/,"");
  if(isFactoryKitPath(n)&&n.startsWith(".ai-kit"))return true;
  if(n===".git"||n.startsWith(".git/"))return true;
  const abs=path.join(repo,n);
  try{
    if(fs.existsSync(path.join(abs,".git")))return true;
  }catch{}
  return false;
}

export function commitDirtyWorktree(repo:string, message:string){
  const sha0=headSha(repo);
  git(repo,["add","-u"],20000);
  const dirty=git(repo,["status","--porcelain"],8000);
  if(!dirty.ok)return {ok:false as const, committed:false, sha:sha0, error:dirty.error};
  for(const line of dirty.stdout.split(/\r?\n/).filter(Boolean)){
    if(!line.startsWith("??"))continue;
    const file=line.slice(3).trim().replace(/^"|"$/g,"");
    if(!file||skipUntracked(repo,file))continue;
    git(repo,["add","--",file],15000);
  }
  const staged=git(repo,["diff","--cached","--name-only"],8000);
  if(!staged.ok)return {ok:false as const, committed:false, sha:sha0, error:staged.error};
  if(!staged.stdout.trim())return {ok:true as const, committed:false, sha:sha0, error:""};
  const committed=git(repo,[...IDENTITY,"commit","--no-gpg-sign","-m",message],20000);
  if(!committed.ok)return {ok:false as const, committed:false, sha:sha0, error:committed.error};
  return {ok:true as const, committed:true, sha:headSha(repo)||sha0, error:""};
}

export function finishFactoryMerge(session:FactoryMergeSession, message:string){
  const result=commitDirtyWorktree(session.repo, message);
  if(!result.ok)return {ok:false as const, committed:false, sha:session.baseSha, error:result.error};
  return {ok:true as const, committed:result.committed, sha:result.sha||session.baseSha, error:""};
}

const KIT_PATHS=["PROGRESS.md","docs/ROADMAP.md","docs/PROJECT_STATE.md"];

export function commitFactoryKit(repo:string, message:string){
  const existing=KIT_PATHS.filter(rel=>fs.existsSync(path.join(repo,rel)));
  if(!existing.length)return {ok:true as const, committed:false, error:""};
  git(repo,["add","--",...existing],15000);
  const dirty=git(repo,["status","--porcelain","--",...existing],8000);
  if(!dirty.ok)return {ok:false as const, committed:false, error:dirty.error};
  if(!dirty.stdout.trim())return {ok:true as const, committed:false, error:""};
  const committed=git(repo,[...IDENTITY,"commit","--no-gpg-sign","-m",message],20000);
  if(!committed.ok)return {ok:false as const, committed:false, error:committed.error};
  return {ok:true as const, committed:true, error:""};
}

export function recordMergeMethod(session:FactoryMergeSession, next:Exclude<MergeMethod,"none"|"mixed">){
  if(session.method==="none")session.method=next;
  else if(session.method!==next)session.method="mixed";
  return session.method;
}
