import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {decideOperationPolicy} from "../src/security/operation-policy";
import {createRuntimeBackup,restoreRuntimeBackup,validateBackup} from "../src/recovery/runtime-backup";
import {migrateRuntimeState,runtimeSchemaVersion} from "../src/upgrade/runtime-migrations";
import {checkUpgradeCompatibility} from "../src/upgrade/compatibility";

const safe=decideOperationPolicy("npm run typecheck");
if(safe.blocked||safe.approvalRequired)throw new Error("Safe command classified incorrectly");

const high=decideOperationPolicy("git reset --hard HEAD");
if(high.risk!=="high"||!high.approvalRequired)throw new Error("High-risk policy failed");

const blocked=decideOperationPolicy("format C:");
if(!blocked.blocked)throw new Error("Blocked operation policy failed");

const data=fs.mkdtempSync(path.join(os.tmpdir(),"ado-rc-data-"));
const backups=fs.mkdtempSync(path.join(os.tmpdir(),"ado-rc-backups-"));
try{
  fs.writeFileSync(path.join(data,"projects.json"),"[]\n","utf8");
  const made=createRuntimeBackup(data,backups);
  const valid=validateBackup(made.target);
  if(!valid.ok)throw new Error("Backup validation failed");

  fs.writeFileSync(path.join(data,"projects.json"),"[{\"changed\":true}]\n","utf8");
  restoreRuntimeBackup(data,made.target);
  if(fs.readFileSync(path.join(data,"projects.json"),"utf8").trim()!=="[]")throw new Error("Backup restore failed");

  const migration=migrateRuntimeState(data);
  if(runtimeSchemaVersion(data)!==3||migration.to!==3)throw new Error("Runtime migration failed");

  const compat=checkUpgradeCompatibility(process.cwd(),data);
  if(!compat.ok)throw new Error("Upgrade compatibility failed: "+compat.issues.join(", "));
}finally{
  fs.rmSync(data,{recursive:true,force:true});
  fs.rmSync(backups,{recursive:true,force:true});
}

console.log("RC Security smoke PASS");
