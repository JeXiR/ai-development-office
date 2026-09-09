import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {runCase,printResults} from "./lib/test-harness";
import {MockProviderEnvironment} from "../src/providers/mock";
import {PixelOfficeReducer} from "../src/pixel-office/reducer";
import {simulatedLifecycle} from "../src/testing/agent-simulator";
import {StateMigrationService} from "../src/reproducibility/migrations";
import {SessionReplayStore} from "../src/replay/store";
import {DisasterRecoveryService} from "../src/recovery/backup";
import {GitIntelligenceService} from "../src/git-intelligence/service";
import {WorkerPool} from "../src/workers/pool";
import type {WorkerConfig} from "../src/workers/types";

async function main(){
  const results=[];

  results.push(await runCase("provider failover simulation",()=>{
    const env=new MockProviderEnvironment()
      .set("codex","unavailable",null)
      .set("claude","healthy",120)
      .set("cursor","degraded",600);
    const decision=env.route({task:"implement secure backend API",preferred:"codex"});
    if(decision.selected!=="claude")throw new Error(`expected claude, got ${decision.selected}`);
  }));

  results.push(await runCase("agent lifecycle simulation",()=>{
    const reducer=new PixelOfficeReducer();
    let state=reducer.initial();
    for(const event of simulatedLifecycle({
      projectId:"p1",sessionId:"s1",agentId:"qa",role:"qa",provider:"claude"
    })){
      state=reducer.runtime(state,event);
    }
    const agent=state.agents.find(x=>x.id==="qa");
    if(!agent||agent.state!=="done"||agent.progress!==100)throw new Error("agent lifecycle reducer mismatch");
  }));

  results.push(await runCase("legacy migration idempotency",()=>{
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-reg-mig-"));
    const file=path.join(temp,"legacy.json");
    fs.writeFileSync(file,JSON.stringify({hello:"world"}),"utf8");
    const svc=new StateMigrationService();
    const first=svc.migrateJsonFile(file);
    const second=svc.migrateJsonFile(file);
    if(!first.changed||first.toVersion!==2||second.changed)throw new Error("migration idempotency failed");
  }));

  results.push(await runCase("session replay consistency",()=>{
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-reg-replay-"));
    const replay=new SessionReplayStore();
    const events=simulatedLifecycle({
      projectId:"p1",sessionId:"s2",agentId:"backend",role:"backend",provider:"codex"
    });
    for(const event of events)replay.append(temp,event);
    const read=replay.read(temp,"s2");
    if(read.events.length!==events.length)throw new Error("replay event count mismatch");
    if(read.events.map(x=>x.type).join("|")!==events.map(x=>x.type).join("|"))throw new Error("replay order mismatch");
  }));

  results.push(await runCase("backup restore round-trip",()=>{
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-reg-backup-"));
    const project=path.join(temp,"project");
    fs.mkdirSync(path.join(project,".ai-kit","state"),{recursive:true});
    fs.writeFileSync(path.join(project,".ai-kit","state","x.json"),JSON.stringify({v:1}),"utf8");
    const svc=new DisasterRecoveryService();
    const backup=svc.create(project,path.join(temp,"backups"));
    fs.writeFileSync(path.join(project,".ai-kit","state","x.json"),JSON.stringify({v:2}),"utf8");
    svc.restore(backup.backupPath,project);
    const restored=JSON.parse(fs.readFileSync(path.join(project,".ai-kit","state","x.json"),"utf8"));
    if(restored.v!==1)throw new Error("backup restore mismatch");
  }));

  results.push(await runCase("git snapshot round-trip",()=>{
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-reg-git-"));
    const run=(args:string[])=>execFileSync("git",args,{cwd:temp,encoding:"utf8"});
    run(["init"]);run(["config","user.email","office@example.test"]);run(["config","user.name","Office Test"]);
    fs.writeFileSync(path.join(temp,"a.txt"),"one\n","utf8");
    run(["add","a.txt"]);run(["commit","-m","initial"]);
    fs.writeFileSync(path.join(temp,"a.txt"),"one\ntwo\n","utf8");
    const svc=new GitIntelligenceService();
    const snap=svc.createSnapshot("p1",temp,"before",true);
    fs.writeFileSync(path.join(temp,"a.txt"),"changed\n","utf8");
    svc.restoreSnapshot(temp,snap.id);
    const text=fs.readFileSync(path.join(temp,"a.txt"),"utf8");
    if(!text.includes("two"))throw new Error("git snapshot restore mismatch");
  }));

  results.push(await runCase("worker pool local selection",()=>{
    const rows:WorkerConfig[]=[{
      id:"local-1",name:"Local",kind:"local",enabled:true,host:null,user:null,port:null,
      container:null,workdir:null,tags:["qa"],maxConcurrent:2
    }];
    const selected=new WorkerPool().select(rows,["qa"]);
    if(!selected||selected.status!=="online")throw new Error("worker selection failed");
  }));

  printResults(results);
}

main().catch(error=>{console.error(error);process.exit(1);});
