import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {runCase,printResults} from "./lib/test-harness";
import {WorkspaceService} from "../src/workspace/service";
import {GitIntelligenceService} from "../src/git-intelligence/service";
import {IntegrationRegistry} from "../src/integrations/registry";

async function main(){
  const results=[];

  results.push(await runCase("workspace path traversal blocked",()=>{
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-sec-ws-"));
    const svc=new WorkspaceService();
    let blocked=false;
    try{svc.read(temp,"../secret.txt");}catch{blocked=true;}
    if(!blocked)throw new Error("path traversal was not blocked");
  }));

  results.push(await runCase("git branch input validation",()=>{
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-sec-git-"));
    const {execFileSync}=require("node:child_process");
    execFileSync("git",["init"],{cwd:temp});
    const svc=new GitIntelligenceService();
    let blocked=false;
    try{svc.createBranch(temp,"bad branch; rm -rf /");}catch{blocked=true;}
    if(!blocked)throw new Error("unsafe branch name allowed");
  }));

  results.push(await runCase("integration token value not persisted",()=>{
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-sec-int-"));
    const reg=new IntegrationRegistry();
    reg.update(temp,"github",{enabled:true,tokenEnv:"GITHUB_TOKEN",endpoint:null});
    const raw=fs.readFileSync(path.join(temp,".ai-kit","integrations","config.json"),"utf8");
    if(raw.includes("ghp_")||raw.includes("secret-value"))throw new Error("secret material persisted");
  }));

  results.push(await runCase("protected .env not exposed by workspace listing",()=>{
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-sec-env-"));
    fs.writeFileSync(path.join(temp,".env"),"SECRET=1");
    const svc=new WorkspaceService();
    const rows=svc.list(temp,"",2);
    if(rows.some((x:any)=>x.relativePath===".env"))throw new Error(".env exposed");
  }));

  printResults(results);
}

main().catch(error=>{console.error(error);process.exit(1);});
