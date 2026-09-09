import fs from "node:fs";import os from "node:os";import path from "node:path";
import {WorkerRegistry} from "../src/workers/registry";
import {DistributedJobStore} from "../src/distributed/job-store";
import {DistributedScheduler} from "../src/distributed/scheduler";
import {DistributedJobRunner} from "../src/distributed/runner";
import {ArtifactTransferService} from "../src/distributed/artifacts";

async function main(){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-dist-"));
  const workers=new WorkerRegistry();
  const local={id:"local-1",name:"Local",kind:"local" as const,enabled:true,host:null,user:null,port:null,container:null,workdir:temp,tags:["qa","default"],maxConcurrent:2};
  workers.upsert(temp,local);

  const jobs=new DistributedJobStore();
  const job=jobs.create("p1",temp,{command:process.platform==="win32"?"echo OFFICE_OK":"printf OFFICE_OK",requiredTags:["qa"],maxAttempts:2});

  const selected=new DistributedScheduler().select(temp,workers.list(temp),["qa"]);
  if(!selected||selected.workerId!=="local-1")throw new Error("scheduler failed");

  const result=await new DistributedJobRunner().run(temp,job,local,{});
  if(result.status!=="completed"||result.exitCode!==0)throw new Error("local distributed execution failed");

  const source=path.join(temp,"artifact.txt"),dest=path.join(temp,"copied","artifact.txt");
  fs.writeFileSync(source,"artifact","utf8");
  const transferred=new ArtifactTransferService().pull(local,source,dest);
  if(!transferred.ok||fs.readFileSync(dest,"utf8")!=="artifact")throw new Error("artifact transfer failed");

  const interrupted=jobs.create("p1",temp,{command:"noop",maxAttempts:2});
  jobs.update(temp,interrupted.id,{status:"running",attempt:1});
  const recovered=jobs.recoverInterrupted(temp);
  if(recovered.recovered!==1)throw new Error("failure recovery failed");

  console.log("Distributed execution smoke PASS");
}
main().catch(e=>{console.error(e);process.exit(1);});
