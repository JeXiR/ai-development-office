import fs from "node:fs";
import path from "node:path";

export type ProgressUpdateInput={
  projectPath:string;
  missionId:string;
  goal:string;
  status:"VERIFIED_DONE"|"PARTIAL"|"BLOCKED"|"TODO";
  summary:string;
  evidence?:string[];
};

function append(file:string,text:string){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.appendFileSync(file,text,"utf8");
}

export function recordMissionProgress(input:ProgressUpdateInput){
  const progressFile=path.join(input.projectPath,"PROGRESS.md");
  const stateFile=path.join(input.projectPath,"docs","PROJECT_STATE.md");

  if(!fs.existsSync(progressFile)){
    fs.writeFileSync(progressFile,"# Progress\n\n","utf8");
  }
  if(!fs.existsSync(stateFile)){
    fs.mkdirSync(path.dirname(stateFile),{recursive:true});
    fs.writeFileSync(stateFile,"# Project State\n\n","utf8");
  }

  const stamp=new Date().toISOString();
  append(progressFile,`
## ${stamp} — ${input.goal}

Status: ${input.status}
Mission: ${input.missionId}

${input.summary}

${input.evidence?.length?"### Evidence\n"+input.evidence.map(x=>`- ${x}`).join("\n")+"\n":""}
`);

  append(stateFile,`
## Office Sync — ${stamp}

Mission: ${input.missionId}
Status: ${input.status}
Goal: ${input.goal}
Summary: ${input.summary}

`);

  return {progressFile,stateFile};
}
