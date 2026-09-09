import os from "node:os";
import path from "node:path";
import {providerQualitySnapshot} from "../src/provider-sdk/adaptive-routing";
import {MissionEvidenceStore} from "../src/orchestration/evidence";
import {ApprovalInboxStore} from "../src/orchestration/approval-inbox";
import {MissionEventJournal} from "../src/orchestration/event-journal";
import {buildMissionReplay} from "../src/orchestration/replay";

function dataDir(){
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA,"AI-Development-Office")
    : path.join(os.homedir(),".ai-development-office");
}

const evidence=new MissionEvidenceStore(dataDir());
const approvals=new ApprovalInboxStore(dataDir());
const journal=new MissionEventJournal(dataDir());

export function adaptiveRoutingSnapshot(){return providerQualitySnapshot();}
export function evidenceList(limit=100){return evidence.list(limit);}
export function evidenceItem(missionId:string){return evidence.read(missionId);}
export function approvalInbox(){return approvals.list();}
export function decideApproval(id:string,status:"approved"|"rejected"){return approvals.decide(id,status);}
export function missionReplay(missionId:string){return buildMissionReplay(journal.forMission(missionId));}
