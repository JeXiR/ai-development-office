import type {IntegrationActionResult,IntegrationRetryPolicy} from "./types";
export const DEFAULT_INTEGRATION_RETRY:IntegrationRetryPolicy={
  maxAttempts:3,baseDelayMs:200,maxDelayMs:2000,retryStatuses:[408,409,425,429,500,502,503,504]
};
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export class IntegrationRetryExecutor{
  async run(fn:(attempt:number)=>Promise<IntegrationActionResult>,policy=DEFAULT_INTEGRATION_RETRY){
    let last:IntegrationActionResult|null=null;
    for(let attempt=1;attempt<=policy.maxAttempts;attempt++){
      last=await fn(attempt);
      if(last.ok)return last;
      const retryable=last.status===null||policy.retryStatuses.includes(last.status);
      if(!retryable||attempt>=policy.maxAttempts)return last;
      await sleep(Math.min(policy.maxDelayMs,policy.baseDelayMs*Math.pow(2,attempt-1)));
    }
    return last!;
  }
}
