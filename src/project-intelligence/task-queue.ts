import type {ProjectDocsSnapshot,ProjectTaskItem} from "./types";

export function missionCandidates(snapshot:ProjectDocsSnapshot){
  const priority:Record<ProjectTaskItem["status"],number>={
    BLOCKED:0,
    DECISION_REQUIRED:1,
    PARTIAL:2,
    TODO:3,
    UNKNOWN:4,
    DEFERRED:5,
    VERIFIED_DONE:99
  };
  return snapshot.tasks
    .filter(x=>x.status!=="VERIFIED_DONE"&&x.status!=="DEFERRED")
    .sort((a,b)=>priority[a.status]-priority[b.status]||a.id.localeCompare(b.id));
}

export function nextSafeMission(snapshot:ProjectDocsSnapshot){
  return missionCandidates(snapshot).find(x=>!["BLOCKED","DECISION_REQUIRED"].includes(x.status))||null;
}
