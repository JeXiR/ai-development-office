import {scanProjectDocs} from "../src/project-intelligence/docs-scanner";
import {bootstrapProjectDocs} from "../src/project-intelligence/docs-bootstrap";
import {missionCandidates,nextSafeMission} from "../src/project-intelligence/task-queue";
import {recordMissionProgress} from "../src/project-intelligence/progress-updater";

export function inspectProjectDocs(projectPath:string){
  const snapshot=scanProjectDocs(projectPath);
  return {
    snapshot,
    missionCandidates:missionCandidates(snapshot),
    nextMission:nextSafeMission(snapshot)
  };
}

export function bootstrapDocs(data:any){
  const result=bootstrapProjectDocs({
    projectPath:String(data?.projectPath||""),
    projectName:String(data?.projectName||"Project"),
    brief:String(data?.brief||""),
    goals:Array.isArray(data?.goals)?data.goals.map(String):[],
    constraints:Array.isArray(data?.constraints)?data.constraints.map(String):[]
  });
  return {
    created:result,
    inspection:inspectProjectDocs(String(data?.projectPath||""))
  };
}

export function recordProgress(data:any){
  return recordMissionProgress({
    projectPath:String(data?.projectPath||""),
    missionId:String(data?.missionId||""),
    goal:String(data?.goal||""),
    status:String(data?.status||"PARTIAL") as any,
    summary:String(data?.summary||""),
    evidence:Array.isArray(data?.evidence)?data.evidence.map(String):[]
  });
}
