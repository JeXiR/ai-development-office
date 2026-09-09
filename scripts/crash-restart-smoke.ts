import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {atomicWriteJson} from "../src/recovery/atomic-write";
import {AutomationStore} from "../src/automation/store";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-crash-"));
const file=path.join(temp,"state.json");

atomicWriteJson(file,{schemaVersion:1,payload:{ok:true}});
const raw=JSON.parse(fs.readFileSync(file,"utf8"));
if(!raw.payload?.ok)throw new Error("atomic write failed");

const automation=new AutomationStore();
automation.createMission("p1",temp,{title:"Crash test",prompt:"noop",cadence:"daily"});
const first=automation.load(temp);
const second=new AutomationStore().load(temp);
if(first.missions.length!==1||second.missions.length!==1)throw new Error("restart persistence failed");

console.log("Crash/restart smoke PASS");
