import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {MissionEvidenceStore} from "../src/orchestration/evidence";
import {MissionEventJournal} from "../src/orchestration/event-journal";
import {buildMissionReplay} from "../src/orchestration/replay";

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-evidence-"));
try{
  const evidence=new MissionEvidenceStore(dir);
  evidence.write({missionId:"m1",createdAt:new Date().toISOString(),goal:"x",projectId:"p",projectPath:"/tmp/p",kitCapabilities:["testing"],assignments:[],providerAttempts:[],testStage:{ok:true},reviewStage:{ok:true},approval:null,finalResult:{status:"completed"}});
  if(evidence.read("m1")?.goal!=="x")throw new Error("Evidence roundtrip failed");

  const journal=new MissionEventJournal(dir);
  journal.append({missionId:"m1",type:"mission.planned",at:new Date().toISOString()});
  journal.append({missionId:"m1",type:"mission.completed",at:new Date().toISOString()});
  const replay=buildMissionReplay(journal.forMission("m1"));
  if(replay.frames.length!==2)throw new Error("Replay frame count failed");
  console.log("Evidence Replay smoke PASS");
}finally{fs.rmSync(dir,{recursive:true,force:true});}
