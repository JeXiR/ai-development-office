import os from "node:os";
import path from "node:path";
import {MissionHistoryStore} from "../src/orchestration/history";

function dataDir(){
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA,"AI-Development-Office")
    : path.join(os.homedir(),".ai-development-office");
}
const store=new MissionHistoryStore(dataDir());

export function missionHistory(limit=100){return store.recent(limit);}
export function missionHistoryItem(missionId:string){return store.find(missionId);}
