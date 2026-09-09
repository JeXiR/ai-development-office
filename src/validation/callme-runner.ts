import path from "node:path";
import fs from "node:fs";
import {callMeReadiness} from "./callme-readiness";
import {callMeValidationCommands} from "./callme-command-plan";
import {runProjectCommand} from "../project-execution/command-tools";
import {projectGitDiff,projectGitHead,projectGitStatus,projectGitTrackedStatus,projectGitTrackedFingerprint} from "../project-execution/git-tools";

export type CallMeValidationResult={
  projectPath:string;
  startedAt:string;
  completedAt:string;
  readiness:ReturnType<typeof callMeReadiness>;
  commands:Array<{
    id:string;
    command:string;
    required:boolean;
    ok:boolean;
    code:number|null;
    timedOut:boolean;
    stdoutTail:string;
    stderrTail:string;
  }>;
  git:{
    headBefore:string|null;
    headAfter:string|null;
    statusBefore:string;
    statusAfter:string;
    trackedStatusBefore:string;
    trackedStatusAfter:string;
    trackedFingerprintBefore:string;
    trackedFingerprintAfter:string;
    untrackedStatusChanged:boolean;
    diffAfter:string;
  };
  passed:boolean;
};

function tail(text:string,limit=5000){return text.length>limit?text.slice(-limit):text;}

export async function runCallMeValidation(projectPath:string):Promise<CallMeValidationResult>{
  const startedAt=new Date().toISOString();
  const readiness=callMeReadiness(projectPath);
  if(!readiness.ready){
    return {
      projectPath,startedAt,completedAt:new Date().toISOString(),readiness,commands:[],
      git:{
        headBefore:null,
        headAfter:null,
        statusBefore:"",
        statusAfter:"",
        trackedStatusBefore:"",
        trackedStatusAfter:"",
        trackedFingerprintBefore:"",
        trackedFingerprintAfter:"",
        untrackedStatusChanged:false,
        diffAfter:""
      },
      passed:false
    };
  }

  const headBefore=projectGitHead(projectPath);
  const statusBefore=projectGitStatus(projectPath);
  const trackedStatusBefore=projectGitTrackedStatus(projectPath);
  const trackedFingerprintBefore=projectGitTrackedFingerprint(projectPath);
  const rows=[];

  for(const step of callMeValidationCommands(projectPath)){
    const result=await runProjectCommand(projectPath,step.command,step.timeoutMs,4*1024*1024);
    rows.push({
      id:step.id,
      command:step.command,
      required:step.required,
      ok:result.code===0&&!result.timedOut,
      code:result.code,
      timedOut:result.timedOut,
      stdoutTail:tail(result.stdout),
      stderrTail:tail(result.stderr)
    });
  }

  const headAfter=projectGitHead(projectPath);
  const statusAfter=projectGitStatus(projectPath);
  const trackedStatusAfter=projectGitTrackedStatus(projectPath);
  const trackedFingerprintAfter=projectGitTrackedFingerprint(projectPath);
  const diffAfter=projectGitDiff(projectPath);

  // Read-only validation must not modify committed/tracked project source.
  // Tests/builds may create/delete untracked runtime artifacts.
  // Fingerprints compare actual tracked/staged diff content, not just porcelain labels.
  const gitStable=
    headBefore===headAfter&&
    trackedFingerprintBefore===trackedFingerprintAfter;
  const untrackedStatusChanged=statusBefore!==statusAfter;
  const requiredCommandsPass=rows.filter(x=>x.required).every(x=>x.ok);

  return {
    projectPath,
    startedAt,
    completedAt:new Date().toISOString(),
    readiness,
    commands:rows,
    git:{
      headBefore,
      headAfter,
      statusBefore,
      statusAfter,
      trackedStatusBefore,
      trackedStatusAfter,
      trackedFingerprintBefore,
      trackedFingerprintAfter,
      untrackedStatusChanged,
      diffAfter
    },
    passed:readiness.ready&&requiredCommandsPass&&gitStable
  };
}
