import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {GitIntelligenceService} from "../src/git-intelligence/service";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-git-"));
const run=(args:string[])=>execFileSync("git",args,{cwd:temp,encoding:"utf8"});
run(["init"]);
run(["config","user.email","office@example.test"]);
run(["config","user.name","Office Smoke"]);
fs.writeFileSync(path.join(temp,"a.txt"),"one\n","utf8");
run(["add","a.txt"]);run(["commit","-m","initial"]);

const service=new GitIntelligenceService();
const graph=service.graph(temp,10);
if(graph.commits.length!==1)throw new Error("git graph failed");

fs.writeFileSync(path.join(temp,"a.txt"),"one\ntwo\n","utf8");
const working=service.workingTree(temp);
if(!working.length)throw new Error("working tree diff failed");

const snap=service.createSnapshot("p1",temp,"before",true);
if(!snap.id)throw new Error("snapshot failed");

service.createBranch(temp,"feature/smoke");
service.commit(temp,"smoke commit");
const branches=service.graph(temp,10).branches;
if(!branches.some(x=>x.name==="feature/smoke"))throw new Error("branch failed");
if(service.workingTree(temp).length)throw new Error("working tree should be clean after commit");

console.log("Git intelligence smoke PASS");
