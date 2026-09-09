import type {RecoveryDecision} from "./types";

export class NoProgressRecovery{
  decide(input:{
    noProgressCount:number;
    repeatedCommandCount:number;
    repeatedErrorCount:number;
    costExceeded:boolean;
    runtimeExceeded:boolean;
    fallbackProvider:string|null;
  }):RecoveryDecision{
    if(input.costExceeded||input.runtimeExceeded)return {action:"stop",reason:input.costExceeded?"Cost ceiling exceeded.":"Runtime ceiling exceeded.",nextProvider:null,steerMessage:null};
    if(input.repeatedErrorCount>=5)return {action:"pause",reason:"High repeated-error count.",nextProvider:null,steerMessage:"Summarize failure state and wait for review."};
    if(input.noProgressCount>=4&&input.fallbackProvider)return {action:"fallback",reason:"No progress across multiple observations.",nextProvider:input.fallbackProvider,steerMessage:null};
    if(input.repeatedCommandCount>=3)return {action:"steer",reason:"Repeated command loop detected.",nextProvider:null,steerMessage:"Stop repeating the same command. Re-evaluate evidence and choose a different approach."};
    if(input.noProgressCount>=2)return {action:"steer",reason:"Progress stalled.",nextProvider:null,steerMessage:"State the blocker, inspect current evidence, then choose one bounded next action."};
    return {action:"continue",reason:"No recovery action required.",nextProvider:null,steerMessage:null};
  }
}
