import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {validateMissionConsistency} from "../src/integration/mission-consistency";
import {normalizeOfficeEvent} from "../src/integration/event-normalizer";
import {IntegrationJournal} from "../src/integration/journal";
import {bootstrapProjectDocs} from "../src/project-intelligence/docs-bootstrap";
import {scanProjectDocs} from "../src/project-intelligence/docs-scanner";
import {writeProjectFile,readProjectFile} from "../src/project-execution/file-tools";
import {mapOfficeRuntimeEvent} from "../src/pixel-office-v2/event-map";

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-beta-integration-"));
try{
  bootstrapProjectDocs({
    projectPath:dir,
    projectName:"Beta Integration",
    brief:"Integration test project",
    goals:["Create a file","Track progress"]
  });

  const docs=scanProjectDocs(dir);
  if(!docs.roadmapFile||!docs.progressFile||!docs.stateFile)throw new Error("Docs integration failed");

  writeProjectFile(dir,"src/demo.txt","hello");
  if(readProjectFile(dir,"src/demo.txt").content!=="hello")throw new Error("Project file tool integration failed");

  const event=normalizeOfficeEvent({type:"autonomous_mission_event",data:{type:"mission.testing",missionId:"m1",agentId:"qa",at:new Date().toISOString()}});
  if(!event||event.source!=="mission")throw new Error("Unified event normalization failed");

  const pixel=mapOfficeRuntimeEvent(event.data);
  if(pixel.station!=="qa"||pixel.state!=="testing")throw new Error("Pixel Office event integration failed");

  const journal=new IntegrationJournal(dir);
  journal.append(event);
  if(journal.recent(10).length!==1)throw new Error("Integration journal failed");

  const consistent=validateMissionConsistency({
    status:"completed",
    changed:true,
    verification:{testsPassed:true,hasDiff:true,hasStatus:true},
    progressStatus:"VERIFIED_DONE"
  });
  if(!consistent.ok)throw new Error("Mission consistency valid case failed");

  const inconsistent=validateMissionConsistency({
    status:"completed",
    changed:true,
    verification:{testsPassed:false,hasDiff:false,hasStatus:false},
    progressStatus:"BLOCKED"
  });
  if(inconsistent.ok||inconsistent.issues.length<2)throw new Error("Mission consistency invalid case failed");

  console.log("Unified Integration smoke PASS");
}finally{
  fs.rmSync(dir,{recursive:true,force:true});
}
