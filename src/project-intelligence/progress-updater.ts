import fs from "node:fs";
import path from "node:path";
import {extractTestFailures,writeLivingProgressFile} from "./progress-completer";

export type ProgressUpdateInput={
  projectPath:string;
  missionId:string;
  goal:string;
  status:"VERIFIED_DONE"|"PARTIAL"|"BLOCKED"|"TODO";
  summary:string;
  evidence?:string[];
};

export function isProviderInfrastructureFailure(summary:string){
  return /(?:OLLAMA_MODEL|API_KEY|API key|CLI is not installed|CLI not found|not configured|No provider available)/i.test(String(summary||""));
}

function append(file:string,text:string){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.appendFileSync(file,text,"utf8");
}

export function recordMissionProgress(input:ProgressUpdateInput){
  const progressFile=path.join(input.projectPath,"PROGRESS.md");
  const stateFile=path.join(input.projectPath,"docs","PROJECT_STATE.md");

  if(input.status==="BLOCKED"&&isProviderInfrastructureFailure(input.summary)){
    return {progressFile,stateFile,skipped:true as const};
  }

  if(!fs.existsSync(progressFile)){
    fs.writeFileSync(progressFile,"# Progress\n\n","utf8");
  }
  if(!fs.existsSync(stateFile)){
    fs.mkdirSync(path.dirname(stateFile),{recursive:true});
    fs.writeFileSync(stateFile,"# Project State\n\n","utf8");
  }

  const ok=input.status==="VERIFIED_DONE";
  writeLivingProgressFile(progressFile,{
    title:input.goal,
    ok,
    summary:input.summary,
    evidence:[input.missionId,...(input.evidence||[])].filter(Boolean).join(" · "),
    testFailures:ok?[]:extractTestFailures([input.summary,...(input.evidence||[])].join("\n"))
  });

  const stamp=new Date().toISOString();
  const state=fs.existsSync(stateFile)?fs.readFileSync(stateFile,"utf8"):"# Project State\n\n";
  const syncBlock=`## Office Sync\n\nMission: ${input.missionId}\nStatus: ${input.status}\nGoal: ${input.goal}\nSummary: ${input.summary}\nUpdated: ${stamp}\n`;
  if(/^## Office Sync$/m.test(state)){
    const next=state.replace(/## Office Sync[\s\S]*?(?=\n## |\s*$)/,syncBlock+"\n");
    fs.writeFileSync(stateFile,next.endsWith("\n")?next:next+"\n","utf8");
  }else{
    append(stateFile,`\n${syncBlock}\n`);
  }

  return {progressFile,stateFile};
}
