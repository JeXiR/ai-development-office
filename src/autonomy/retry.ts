import type {RetryStrategy} from "./types";

export class IntelligentRetryStrategy{
  decide(input:{
    attempt:number;
    maxAttempts:number;
    repeatedErrors:number;
    noProgressCount:number;
    currentProvider:string;
    fallbackProviders:string[];
    costExceeded:boolean;
    destructiveRisk:boolean;
  }):RetryStrategy{
    if(input.destructiveRisk)return {action:"request_human",delaySeconds:0,provider:null,reason:"Destructive-risk retry requires human approval."};
    if(input.costExceeded)return {action:"stop",delaySeconds:0,provider:null,reason:"Cost ceiling reached."};
    if(input.attempt>=input.maxAttempts)return {action:"stop",delaySeconds:0,provider:null,reason:"Maximum retry attempts reached."};
    if(input.noProgressCount>=3){
      const fallback=input.fallbackProviders.find(x=>x!==input.currentProvider)||null;
      return fallback
        ?{action:"retry_fallback",delaySeconds:5,provider:fallback,reason:"Repeated no-progress detected; switch provider."}
        :{action:"constrain",delaySeconds:0,provider:null,reason:"Repeated no-progress detected; constrain scope."};
    }
    if(input.repeatedErrors>=2){
      const fallback=input.fallbackProviders.find(x=>x!==input.currentProvider)||null;
      if(fallback)return {action:"retry_fallback",delaySeconds:Math.min(30,5*input.attempt),provider:fallback,reason:"Repeated errors detected."};
    }
    return {action:"retry_same",delaySeconds:Math.min(30,3*input.attempt),provider:input.currentProvider,reason:"Transient failure; retry same provider."};
  }
}
