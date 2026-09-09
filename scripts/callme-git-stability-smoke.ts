import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {
  projectGitStatus,
  projectGitTrackedStatus,
  projectGitTrackedFingerprint
} from "../src/project-execution/git-tools";

function git(cwd:string,args:string[]){
  return String(execFileSync("git",args,{cwd,encoding:"utf8",windowsHide:true})).trim();
}

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-callme-git-"));
try{
  git(dir,["init"]);
  git(dir,["config","user.email","smoke@example.invalid"]);
  git(dir,["config","user.name","Smoke"]);
  git(dir,["config","core.autocrlf","false"]);

  fs.writeFileSync(path.join(dir,"tracked.txt"),"base\n");
  git(dir,["add","tracked.txt"]);
  git(dir,["commit","-m","base"]);

  // Existing tracked dirt is allowed if untouched by validation.
  fs.writeFileSync(path.join(dir,"tracked.txt"),"existing dirty state\n");
  const trackedStatusBefore=projectGitTrackedStatus(dir);
  const fingerprintBefore=projectGitTrackedFingerprint(dir);
  const fullBefore=projectGitStatus(dir);

  // Simulate untracked test/runtime output.
  fs.writeFileSync(path.join(dir,"runtime.tmp"),"generated\n");
  const trackedStatusAfterUntracked=projectGitTrackedStatus(dir);
  const fingerprintAfterUntracked=projectGitTrackedFingerprint(dir);
  const fullAfterUntracked=projectGitStatus(dir);

  if(trackedStatusBefore!==trackedStatusAfterUntracked){
    throw new Error("Untracked artifact incorrectly changed tracked status.");
  }
  if(fingerprintBefore!==fingerprintAfterUntracked){
    throw new Error("Untracked artifact incorrectly changed tracked fingerprint.");
  }
  if(fullBefore===fullAfterUntracked){
    throw new Error("Full status should observe untracked artifact.");
  }

  // Mutate an already-dirty tracked file. Porcelain status may stay identical,
  // but fingerprint MUST change.
  fs.appendFileSync(path.join(dir,"tracked.txt"),"validator mutation\n");
  const trackedStatusMutated=projectGitTrackedStatus(dir);
  const fingerprintMutated=projectGitTrackedFingerprint(dir);

  if(trackedStatusMutated!==trackedStatusAfterUntracked){
    // This is fine too, but not required for detection.
  }
  if(fingerprintMutated===fingerprintAfterUntracked){
    throw new Error("Tracked source mutation was not detected by fingerprint.");
  }

  console.log("CallMe Git Stability smoke PASS");
}finally{
  fs.rmSync(dir,{recursive:true,force:true});
}
