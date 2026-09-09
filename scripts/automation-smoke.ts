import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {AutomationEngine} from "../src/automation/engine";

async function main(){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-auto-"));
  const engine=new AutomationEngine();
  engine.store.createMission("p1",temp,{
    title:"Smoke",prompt:"Run smoke",cadence:"once",
    nextRunAt:new Date(Date.now()-1000).toISOString()
  });
  const due=engine.store.due(temp);
  if(due.length!==1)throw new Error("due mission failed");
  const result=await engine.runDue("p1",temp,async()=>({ok:true,result:"done"}));
  if(result.length!==1||!result[0].ok)throw new Error("mission execution failed");
  const hb=engine.store.heartbeat("p1",temp,{enabled:true,intervalMinutes:15});
  if(!hb.enabled)throw new Error("heartbeat failed");
  console.log("Automation smoke PASS");
}
main().catch(e=>{console.error(e);process.exit(1);});
