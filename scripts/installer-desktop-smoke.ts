import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {VersionDetector} from "../src/installer/version-detector";
import {StagedUpdater} from "../src/installer/updater-v2";
import {PrerequisiteDetector} from "../src/installer/prerequisites";
import {desktopRuntimeInfo} from "../src/desktop/runtime";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-installer-"));
const source=path.join(temp,"source");
fs.mkdirSync(source,{recursive:true});
fs.writeFileSync(path.join(source,"package.json"),JSON.stringify({version:"9.9.9"}),"utf8");
fs.writeFileSync(path.join(source,"office.manifest.json"),JSON.stringify({version:"9.9.9"}),"utf8");

const updater=new StagedUpdater(path.join(temp,"runtime"));
const stage=updater.stage(source,"9.9.9");
const verified=updater.verify(stage);
if(!verified.verified)throw new Error("stage verification failed");

const current=path.join(temp,"current");
fs.mkdirSync(current,{recursive:true});
fs.writeFileSync(path.join(current,"package.json"),JSON.stringify({version:"1.0.0"}),"utf8");
fs.writeFileSync(path.join(current,"office.manifest.json"),JSON.stringify({version:"1.0.0"}),"utf8");

const applied=updater.applyVerified(verified,current);
const detected=new VersionDetector().current(current);
if(detected.packageVersion!=="9.9.9"||!detected.consistent)throw new Error("staged apply failed");

updater.rollback(applied.rollbackPath,current);
const rolled=new VersionDetector().current(current);
if(rolled.packageVersion!=="1.0.0")throw new Error("rollback failed");

const prereqs=new PrerequisiteDetector().check();
if(!prereqs.some(x=>x.id==="node"))throw new Error("prerequisite detector failed");

const runtime=desktopRuntimeInfo();
if(!runtime.platform||!runtime.arch)throw new Error("desktop runtime info failed");

console.log("Installer/desktop smoke PASS");
