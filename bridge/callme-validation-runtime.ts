import os from "node:os";
import path from "node:path";
import {callMeReadiness} from "../src/validation/callme-readiness";
import {runCallMeValidation} from "../src/validation/callme-runner";
import {CALLME_CANARY_MISSION} from "../src/validation/callme-canary";
import {ValidationReportStore} from "../src/validation/report-store";
import {inspectProjectDocs} from "./project-intelligence-runtime";

function dataDir(){
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA,"AI-Development-Office")
    : path.join(os.homedir(),".ai-development-office");
}
const reports=new ValidationReportStore(dataDir());

export function callMeReadinessSnapshot(projectPath:string){
  const readiness=callMeReadiness(projectPath);
  return {
    readiness,
    docs:inspectProjectDocs(projectPath),
    canary:CALLME_CANARY_MISSION
  };
}

export async function executeCallMeValidation(projectPath:string){
  const result=await runCallMeValidation(projectPath);
  const reportPath=reports.write(`callme-${Date.now()}`,result);
  return {...result,reportPath};
}
