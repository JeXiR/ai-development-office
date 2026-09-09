import fs from "node:fs";import os from "node:os";import path from "node:path";import {execFileSync} from "node:child_process";
import {GitIntelligenceService} from "../src/git-intelligence/service";import {MergeConflictAssistant} from "../src/git-intelligence/merge-assistant";import {AutoGitPolicyStore} from "../src/git-intelligence/policy";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-gitcode-"));
const run=(args:string[])=>execFileSync("git",args,{cwd:temp,encoding:"utf8"});
run(["init"]);run(["config","user.email","office@example.test"]);run(["config","user.name","Office Smoke"]);
fs.writeFileSync(path.join(temp,"a.txt"),"one\n","utf8");run(["add","a.txt"]);run(["commit","-m","initial"]);
const initial=run(["rev-parse","HEAD"]).trim();
fs.writeFileSync(path.join(temp,"a.txt"),"one\ntwo\n","utf8");

const svc=new GitIntelligenceService();
const side=svc.sideBySide(temp,"a.txt");
if(!side.before.includes("one")||!side.after.includes("two"))throw new Error("side by side failed");
if(!svc.blame(temp,"a.txt").length)throw new Error("blame failed");

const policy=new AutoGitPolicyStore().save(temp,{autoBranch:true,autoCommit:true,branchPrefix:"office/",commitPrefix:"office:",requireCleanBase:true});
if(!policy.autoBranch||!policy.autoCommit)throw new Error("policy failed");

fs.writeFileSync(path.join(temp,"conflict.txt"),"<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> branch\n","utf8");
const inspection=new MergeConflictAssistant().inspect(temp,"conflict.txt");
if(inspection.strategy!=="manual")throw new Error("conflict assistant failed");

const plan=svc.bisectPlan(temp,initial,"HEAD");
if(plan.candidateCount<0)throw new Error("bisect plan failed");

console.log("Git code intelligence smoke PASS");
