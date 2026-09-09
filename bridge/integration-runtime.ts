import os from "node:os";
import path from "node:path";
import {IntegrationJournal} from "../src/integration/journal";
import {normalizeOfficeEvent} from "../src/integration/event-normalizer";
import {unifiedReadiness} from "./unified-readiness-runtime";

function dataDir(){
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA,"AI-Development-Office")
    : path.join(os.homedir(),".ai-development-office");
}

const journal=new IntegrationJournal(dataDir());

export function recordIntegrationMessage(message:any){
  const normalized=normalizeOfficeEvent(message);
  if(normalized)journal.append(normalized);
  return normalized;
}

export function integrationHistory(limit=200){return journal.recent(limit);}
export async function integrationReadiness(projectPath?:string|null){return unifiedReadiness(projectPath);}
