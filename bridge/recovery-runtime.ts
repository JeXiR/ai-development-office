import os from "node:os";
import path from "node:path";
import {createRuntimeBackup,restoreRuntimeBackup,validateBackup} from "../src/recovery/runtime-backup";
import {LastKnownGoodStore} from "../src/recovery/last-known-good";
import {migrateRuntimeState} from "../src/upgrade/runtime-migrations";
import {checkUpgradeCompatibility} from "../src/upgrade/compatibility";

function dataDir(){
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA,"AI-Development-Office")
    : path.join(os.homedir(),".ai-development-office");
}
function backupRoot(){return path.join(dataDir(),"backups");}

const lkg=new LastKnownGoodStore(dataDir());

export function createBackup(){
  return createRuntimeBackup(dataDir(),backupRoot());
}
export function validateBackupPath(backupPath:string){return validateBackup(backupPath);}
export function restoreBackup(backupPath:string){return restoreRuntimeBackup(dataDir(),backupPath);}
export function runtimeMigration(){return migrateRuntimeState(dataDir());}
export function upgradeCompatibility(){return checkUpgradeCompatibility(process.cwd(),dataDir());}
export function getLastKnownGood(){return lkg.read();}
export function saveLastKnownGood(data:any){
  lkg.write({
    at:new Date().toISOString(),
    officeVersion:String(data?.officeVersion||"unknown"),
    projectPath:data?.projectPath?String(data.projectPath):null,
    checks:data?.checks&&typeof data.checks==="object"?data.checks:{}
  });
  return lkg.read();
}
