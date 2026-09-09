import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {projectGitTrackedFingerprint} from "../src/project-execution/git-tools";

function git(cwd:string,args:string[]){
  return String(execFileSync("git",args,{cwd,encoding:"utf8",windowsHide:true})).trim();
}

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-git-fingerprint-"));
try{
  git(dir,["init"]);
  git(dir,["config","user.email","smoke@example.invalid"]);
  git(dir,["config","user.name","Smoke"]);
  git(dir,["config","core.autocrlf","false"]);

  fs.writeFileSync(path.join(dir,"a.txt"),"a\n");
  git(dir,["add","a.txt"]);
  git(dir,["commit","-m","base"]);

  const clean=projectGitTrackedFingerprint(dir);
  fs.writeFileSync(path.join(dir,"tmp.txt"),"untracked\n");
  const untracked=projectGitTrackedFingerprint(dir);
  if(clean!==untracked)throw new Error("Untracked file changed tracked fingerprint.");

  fs.appendFileSync(path.join(dir,"a.txt"),"b\n");
  const dirty1=projectGitTrackedFingerprint(dir);
  if(dirty1===clean)throw new Error("Tracked worktree change not fingerprinted.");

  fs.appendFileSync(path.join(dir,"a.txt"),"c\n");
  const dirty2=projectGitTrackedFingerprint(dir);
  if(dirty2===dirty1)throw new Error("Second mutation of already-dirty tracked file not detected.");

  git(dir,["add","a.txt"]);
  const staged=projectGitTrackedFingerprint(dir);
  if(staged===dirty2)throw new Error("Staged diff state not represented in fingerprint.");

  console.log("Git Fingerprint smoke PASS");
}finally{
  fs.rmSync(dir,{recursive:true,force:true});
}
