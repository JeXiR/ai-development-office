import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {bootstrapProjectDocs} from "../src/project-intelligence/docs-bootstrap";
import {scanProjectDocs} from "../src/project-intelligence/docs-scanner";
import {missionCandidates,nextSafeMission} from "../src/project-intelligence/task-queue";
import {recordMissionProgress} from "../src/project-intelligence/progress-updater";

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

  recordMissionProgress({
    projectPath:dir,
    missionId:"m1",
    goal:"Implement auth",
    status:"VERIFIED_DONE",
    summary:"Auth completed",
    evidence:["tests pass"]
  });
  const progress=fs.readFileSync(path.join(dir,"PROGRESS.md"),"utf8");
  if(!progress.includes("m1")||!progress.includes("VERIFIED_DONE"))throw new Error("Progress sync failed");

  console.log("Project Docs Intelligence smoke PASS");
}finally{
  fs.rmSync(dir,{recursive:true,force:true});
}
