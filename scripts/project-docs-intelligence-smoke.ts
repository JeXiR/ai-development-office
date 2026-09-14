import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {bootstrapProjectDocs,ensureOfficeProjectDocs,isDocsBootstrapGoal} from "../src/project-intelligence/docs-bootstrap";
import {scanProjectDocs} from "../src/project-intelligence/docs-scanner";
import {missionCandidates,nextSafeMission} from "../src/project-intelligence/task-queue";
import {openProgressItems} from "../src/project-intelligence/progress-completer";
import {isProviderInfrastructureFailure,recordMissionProgress} from "../src/project-intelligence/progress-updater";

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-docs-intel-"));
try{
  bootstrapProjectDocs({
    projectPath:dir,
    projectName:"Demo",
    brief:"Build a secure Laravel application",
    goals:["Implement auth","Add tests"]
  });

  const snap=scanProjectDocs(dir);
  if(!snap.roadmapFile||!snap.progressFile||!snap.stateFile)throw new Error("Docs bootstrap/scan failed");
  const missions=missionCandidates(snap);
  if(!missions.length)throw new Error("No mission candidates found");
  if(!nextSafeMission(snap))throw new Error("Next safe mission not resolved");
  const open=openProgressItems(fs.readFileSync(path.join(dir,"PROGRESS.md"),"utf8"));
  if(open.length<3)throw new Error("Bootstrap PROGRESS.md must contain open checkbox work");
  if(!isDocsBootstrapGoal("Create Project Docs"))throw new Error("Create Project Docs must be a local docs goal");

  const blockedDir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-docs-blocked-"));
  fs.writeFileSync(path.join(blockedDir,"PROGRESS.md"),`# Progress\n\n## 2026-09-11 — Create Project Docs\n\nStatus: BLOCKED\n\nMission did not complete cleanly. cto: OLLAMA_MODEL is not configured.\n`,"utf8");
  const repaired=ensureOfficeProjectDocs({projectPath:blockedDir,projectName:"Blocked",brief:"Repair"});
  if(!repaired.repaired)throw new Error("Blocked PROGRESS.md without checkboxes must be repaired");
  if(!openProgressItems(fs.readFileSync(path.join(blockedDir,"PROGRESS.md"),"utf8")).length){
    throw new Error("Repaired PROGRESS.md still has no open work");
  }
  fs.rmSync(blockedDir,{recursive:true,force:true});

  const skipped=recordMissionProgress({
    projectPath:dir,
    missionId:"skip-infra",
    goal:"Create Project Docs",
    status:"BLOCKED",
    summary:"cto: OLLAMA_MODEL is not configured."
  });
  if(!("skipped" in skipped)||!skipped.skipped)throw new Error("Provider config failures must not overwrite PROGRESS.md");
  if(!isProviderInfrastructureFailure("OLLAMA_MODEL is not configured."))throw new Error("infra failure detector missed Ollama");

  recordMissionProgress({
    projectPath:dir,
    missionId:"m1",
    goal:"Implement auth",
    status:"VERIFIED_DONE",
    summary:"Auth completed",
    evidence:["tests pass"]
  });
  const progress=fs.readFileSync(path.join(dir,"PROGRESS.md"),"utf8");
  if(!progress.includes("m1")||!/PASS · Implement auth/.test(progress)||!/## Validation/.test(progress)){
    throw new Error("Progress sync failed");
  }
  if(/## 20\d{2}-\d{2}-\d{2}T/.test(progress))throw new Error("living PROGRESS must not append timestamp headings");

  console.log("Project Docs Intelligence smoke PASS");
}finally{
  fs.rmSync(dir,{recursive:true,force:true});
}
