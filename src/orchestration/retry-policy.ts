export type MissionRetryPolicy={
  maxMissionAttempts:number;
  maxAgentAttempts:number;
  retryOnProviderFailure:boolean;
  retryOnEmptyResult:boolean;
  retryDelayMs:number;
};

export const DEFAULT_MISSION_RETRY_POLICY:MissionRetryPolicy={
  maxMissionAttempts:2,
  maxAgentAttempts:3,
  retryOnProviderFailure:true,
  retryOnEmptyResult:true,
  retryDelayMs:500
};

export function shouldRetryAgent(input:{
  attempt:number;
  ok:boolean;
  output:unknown;
  error:string|null;
},policy:MissionRetryPolicy){
  if(input.attempt>=policy.maxAgentAttempts)return false;
  if(!input.ok&&policy.retryOnProviderFailure)return true;
  if(policy.retryOnEmptyResult){
    const empty=input.output==null||input.output===""||(typeof input.output==="object"&&Object.keys(input.output as any).length===0);
    if(empty)return true;
  }
  return false;
}
