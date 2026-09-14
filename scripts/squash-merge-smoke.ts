import {execFileSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  abortFactoryMerge,
  beginFactoryMerge,
  commitDirtyWorktree,
  commitFactoryKit,
  commitWorktree,
  finishFactoryMerge,
  isFactoryKitPath,
  isProductSourcePath,
  squashBranch
} from "../src/coordination/squash-merge";
import {formatWakeup,idleRuntimeSessions} from "../src/collaboration/hive";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-squash-"));
const run=(cwd:string,args:string[])=>execFileSync("git",args,{cwd,encoding:"utf8"});

if(!isFactoryKitPath("PROGRESS.md")||!isFactoryKitPath("docs/ROADMAP.md")||!isFactoryKitPath("docs/office-mission-log.md")||isFactoryKitPath("src/app.ts")){
  throw new Error("kit path filter failed");
}
if(!isProductSourcePath("app/Models/Site.php")||!isProductSourcePath("database/migrations/x.php")||!isProductSourcePath("tests/Feature/SiteCrudTest.php")||!isProductSourcePath("bootstrap/app.php")||isProductSourcePath(".env")||isProductSourcePath("docs/ROADMAP.md")){
  throw new Error("product source path filter failed");
}

run(temp,["init"]);
run(temp,["config","user.email","office@example.test"]);
run(temp,["config","user.name","Office Smoke"]);
fs.writeFileSync(path.join(temp,"app.ts"),"export const n=1;\n","utf8");
run(temp,["add","app.ts"]);
run(temp,["commit","-m","initial"]);

const wt=path.join(temp,".wt-lead");
run(temp,["worktree","add","-b","office/smoke-lead",wt,"HEAD"]);
fs.writeFileSync(path.join(wt,"app.ts"),"export const n=2;\n","utf8");
const committed=commitWorktree(wt,"office smoke lead");
if(!committed.ok||!committed.committed)throw new Error(`worktree commit failed: ${committed.error}`);

const session=beginFactoryMerge(temp);
if(!("repo" in session))throw new Error(session.error);
const squashed=squashBranch(temp,"office/smoke-lead");
if(!squashed.ok)throw new Error(`squash failed: ${squashed.error}`);
const finished=finishFactoryMerge(session,"office-factory: smoke squash");
if(!finished.ok||!finished.committed)throw new Error(`finish commit failed: ${finished.error}`);
if(fs.readFileSync(path.join(temp,"app.ts"),"utf8").replace(/\r\n/g,"\n")!=="export const n=2;\n")throw new Error("main missing squashed change");
const files=execFileSync("git",["show","--name-only","--pretty=format:", "HEAD"],{cwd:temp,encoding:"utf8"});
if(files.includes(".wt-lead"))throw new Error("squash commit included worktree directory");

const wt2=path.join(temp,".wt-abort");
run(temp,["worktree","add","-b","office/smoke-abort",wt2,"HEAD"]);
fs.writeFileSync(path.join(wt2,"app.ts"),"export const n=3;\n","utf8");
if(!commitWorktree(wt2,"office smoke abort").ok)throw new Error("abort worktree commit failed");
const abortSession=beginFactoryMerge(temp);
if(!("repo" in abortSession))throw new Error(abortSession.error);
if(!squashBranch(temp,"office/smoke-abort").ok)throw new Error("abort squash failed");
if(!abortFactoryMerge(abortSession).ok)throw new Error("abort reset failed");
if(fs.readFileSync(path.join(temp,"app.ts"),"utf8").replace(/\r\n/g,"\n")!=="export const n=2;\n")throw new Error("abort did not restore HEAD");

fs.writeFileSync(path.join(temp,"PROGRESS.md"),"- [x] smoke\n","utf8");
const kit=commitFactoryKit(temp,"office-factory: record smoke");
if(!kit.ok||!kit.committed)throw new Error(`kit commit failed: ${kit.error}`);

fs.writeFileSync(path.join(temp,"app.ts"),"export const n=4;\n","utf8");
fs.mkdirSync(path.join(temp,"docs"),{recursive:true});
fs.writeFileSync(path.join(temp,"docs","PROJECT_STATE.md"),"solo continue\n","utf8");
fs.mkdirSync(path.join(temp,".ai-kit"),{recursive:true});
fs.writeFileSync(path.join(temp,".ai-kit","noise.json"),"{}\n","utf8");
const solo=commitDirtyWorktree(temp,"office-factory: solo continue");
if(!solo.ok||!solo.committed)throw new Error(`solo dirty commit failed: ${solo.error}`);
const soloFiles=execFileSync("git",["show","--name-only","--pretty=format:", "HEAD"],{cwd:temp,encoding:"utf8"});
if(!soloFiles.includes("app.ts")||!soloFiles.includes("docs/PROJECT_STATE.md"))throw new Error(`solo commit missed product files: ${soloFiles}`);
if(soloFiles.includes(".ai-kit"))throw new Error("solo commit included untracked .ai-kit");

if(!/\[OFFICE WAKEUP\] qa/.test(formatWakeup("QA")))throw new Error("wakeup payload missing");
const idle=idleRuntimeSessions([
  {id:"live",status:"running",lastActivityAt:new Date(Date.now()-10*60*1000).toISOString()},
  {id:"fresh",status:"running",lastActivityAt:new Date().toISOString()},
  {id:"paused",status:"running",paused:true,lastActivityAt:new Date(Date.now()-10*60*1000).toISOString()},
  {id:"dead",status:"exited",lastActivityAt:new Date(Date.now()-10*60*1000).toISOString()}
], Date.now(), 4*60*1000);
if(idle.join(",")!=="live")throw new Error(`idle filter failed: ${idle.join(",")}`);

console.log("Squash-merge smoke PASS");
