import fs from "node:fs";import os from "node:os";import path from "node:path";
import {IntegrationRetryExecutor} from "../src/integrations-v2/retry";
import {IntegrationAuditLog} from "../src/integrations-v2/audit";
import {IntegrationWatchStore} from "../src/integrations-v2/watch-store";

async function main(){
  let attempts=0;
  const retry=new IntegrationRetryExecutor();
  const result=await retry.run(async attempt=>{
    attempts=attempt;
    return {ok:attempt>=2,status:attempt>=2?200:503,data:null,message:attempt>=2?"OK":"retry",attempt,durationMs:1};
  },{maxAttempts:3,baseDelayMs:1,maxDelayMs:2,retryStatuses:[503]});
  if(!result.ok||attempts!==2)throw new Error("retry executor failed");

  const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-intv2-"));
  const audit=new IntegrationAuditLog();
  audit.append("p1",temp,{integrationId:"github",action:"create_issue",actor:"qa",status:"success",attempt:1,durationMs:10,message:"OK"});
  if(audit.list(temp).length!==1)throw new Error("audit log failed");

  const watches=new IntegrationWatchStore();
  const watch=watches.add("p1",temp,{integrationId:"ci",kind:"ci-status",resource:"https://example.invalid/status",intervalMinutes:15});
  watches.updateState(temp,watch.id,"passing");
  if(watches.list(temp)[0].lastState!=="passing")throw new Error("watch store failed");

  console.log("Integrations v2 smoke PASS");
}
main().catch(e=>{console.error(e);process.exit(1);});
