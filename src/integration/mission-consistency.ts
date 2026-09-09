export type MissionConsistencyInput={
  status:string;
  changed?:boolean;
  verification?:{testsPassed?:boolean|null;hasDiff?:boolean;hasStatus?:boolean}|null;
  evidence?:unknown;
  progressStatus?:string|null;
};

export type MissionConsistencyResult={
  ok:boolean;
  issues:string[];
};

export function validateMissionConsistency(input:MissionConsistencyInput):MissionConsistencyResult{
  const issues:string[]=[];

  if(input.status==="completed"){
    if(input.changed===true&&input.verification?.hasDiff===false&&input.verification?.hasStatus===false){
      issues.push("Mission reports changed=true but Git evidence has no diff/status.");
    }
    if(input.verification?.testsPassed===false){
      issues.push("Mission is completed although project tests failed.");
    }
    if(input.progressStatus==="BLOCKED"){
      issues.push("Mission is completed while project progress is BLOCKED.");
    }
  }

  if(input.status==="failed"&&input.progressStatus==="VERIFIED_DONE"){
    issues.push("Failed mission cannot be recorded as VERIFIED_DONE.");
  }

  return {ok:issues.length===0,issues};
}
