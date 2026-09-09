import fs from "node:fs";import os from "node:os";import path from "node:path";
import {SessionReplayStore} from "../src/replay/store";import {DisasterRecoveryService} from "../src/recovery/backup";
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-replay-"));const project=path.join(temp,"project");fs.mkdirSync(path.join(project,".ai-kit"),{recursive:true});fs.writeFileSync(path.join(project,".ai-kit","x.json"),"{}");
const replay=new SessionReplayStore();
replay.append(project,{id:"e1",type:"runtime.session.output",timestamp:new Date().toISOString(),sessionId:"s1",projectId:"p1",agentId:"a1",role:"qa",provider:"claude",payload:{data:"ok"}});
if(replay.read(project,"s1").events.length!==1)throw new Error("replay failed");
const backup=new DisasterRecoveryService().create(project,path.join(temp,"backups"));
if(!fs.existsSync(backup.backupPath))throw new Error("backup failed");
console.log("Replay/recovery smoke PASS");
