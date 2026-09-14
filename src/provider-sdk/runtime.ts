import {BUILTIN_PROVIDER_MANIFESTS} from "./manifests";
import {createBuiltinAdapters} from "./builtins";
import {maskedCredentialState,providerConfigured,providerEndpoint} from "./config";
import type {ProviderExecutionRequest,ProviderExecutionResult,ProviderRouteDecision,ProviderRouteRequest,ProviderRuntimeState} from "./runtime-types";
import {ProviderStreamBus} from "./streaming";
import {outputToStreamChunks} from "./stream-normalizer";
import type {ProviderPolicy} from "./policy";
import {adaptiveQualityBonus} from "./adaptive-routing";
import {isProviderRouteEligible,isUnconfiguredProviderError} from "./eligibility";
import type {ProviderManifest,UniversalProviderAdapter,UniversalProviderId} from "./types";

export class UniversalProviderRuntime{
  private adapters=new Map<UniversalProviderId,UniversalProviderAdapter>();
  readonly streams=new ProviderStreamBus();

  constructor(adapters=createBuiltinAdapters()){
    for(const adapter of adapters)this.adapters.set(adapter.manifest.id,adapter);
  }

  manifests(){return BUILTIN_PROVIDER_MANIFESTS.slice();}

  async state():Promise<ProviderRuntimeState[]>{
    const rows:ProviderRuntimeState[]=[];
    for(const manifest of this.manifests()){
      const adapter=this.adapters.get(manifest.id)||null;
      let detected=false,health=null,models:string[]=[],lastError:string|null=null;
      try{
        if(adapter){
          detected=await adapter.detect();
          health=await adapter.health();
          if(health.available)models=await adapter.models();
        }
      }catch(error:any){lastError=String(error?.message||error);}
      rows.push({
        id:manifest.id,
        manifest,
        configured:providerConfigured(manifest),
        detected,
        health,
        models,
        lastError
      });
    }
    return rows;
  }

  private capabilityScore(manifest:ProviderManifest,request:ProviderRouteRequest){
    let score=0;
    const reasons:string[]=[];
    for(const requirement of request.requires||[]){
      if(manifest.capabilities[requirement]===true){score+=20;reasons.push(`supports ${String(requirement)}`);}
      else{score-=100;reasons.push(`missing ${String(requirement)}`);}
    }
    if(request.preferredProvider===manifest.id){score+=50;reasons.push("preferred provider");}
    if(manifest.capabilities.local){score+=request.allowLocal===false?-100:5;reasons.push(manifest.capabilities.local?"local provider":"");}
    if(["cursor","opencode"].includes(manifest.id)){score+=25;reasons.push("local CLI integration");}
    if(manifest.id==="ollama"&&request.preferredProvider!=="ollama"){
      score-=20;
      reasons.push("ollama is opt-in");
    }
    return {score,reasons:reasons.filter(Boolean)};
  }

  async route(request:ProviderRouteRequest={},policy?:ProviderPolicy):Promise<ProviderRouteDecision>{
    const excluded=new Set(request.excludedProviders||[]);
    const state=await this.state();
    const candidates=state
      .filter(x=>!excluded.has(x.id)&&isProviderRouteEligible(x))
      .map(row=>{
        const base=this.capabilityScore(row.manifest,request);
        let score=base.score;
        const reasons=[...base.reasons];
        if(row.health?.available){score+=40;reasons.push("healthy");}
        else{score-=80;reasons.push("unavailable");}
        if(row.configured){score+=15;reasons.push("configured");}
        if(row.models.length){score+=5;reasons.push(`${row.models.length} model(s) discovered`);}
        const qualityBonus=adaptiveQualityBonus(row.id,request.taskType||"development");
        if(qualityBonus){score+=qualityBonus;reasons.push(`quality feedback ${qualityBonus>0?"+":""}${qualityBonus}`);}
        if(policy){
          const weight=policy.providerWeights[row.id]||0;
          if(weight){score+=weight;reasons.push(`policy weight ${weight}`);}
          if(policy.fallback.order.includes(row.id)){
            const index=policy.fallback.order.indexOf(row.id);
            const bonus=Math.max(0,20-index*2);
            score+=bonus;
            reasons.push(`fallback priority ${index+1}`);
          }
          if(policy.preference==="latency"&&row.health?.latencyMs!=null){
            const bonus=Math.max(0,20-Math.floor(row.health.latencyMs/100));
            score+=bonus; reasons.push(`latency preference +${bonus}`);
          }
          if(policy.preference==="quality"&&["openai","anthropic","gemini","xai"].includes(row.id)){
            score+=10; reasons.push("quality preference");
          }
          if(policy.preference==="cost"&&["groq","ollama"].includes(row.id)){
            score+=10; reasons.push("cost preference");
          }
        }
        return {providerId:row.id,score,reasons};
      })
      .sort((a,b)=>b.score-a.score||a.providerId.localeCompare(b.providerId));

    const first=candidates.find(x=>x.score>=0)||null;
    return {
      providerId:first?.providerId||null,
      score:first?.score??-1,
      reasons:first?.reasons||[],
      policyPreference:policy?.preference,
      evidenceId:`route-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      candidates
    };
  }

  async execute(request:ProviderExecutionRequest):Promise<ProviderExecutionResult>{
    const attempts:ProviderExecutionResult["attempts"]=[];
    const excluded:UniversalProviderId[]=[];
    const maxAttempts=3;

    for(let i=0;i<maxAttempts;i++){
      const decision=await this.route({...request.route,excludedProviders:[...(request.route?.excludedProviders||[]),...excluded]});
      if(!decision.providerId)break;
      const providerId=decision.providerId;
      const adapter=this.adapters.get(providerId);
      if(!adapter){excluded.push(providerId);continue;}

      try{
        const session=await adapter.createSession({model:request.model,system:request.system});
        const output=await adapter.sendTask(session.id,{prompt:request.prompt,system:request.system,model:request.model,tools:(request as any).tools,responseSchema:(request as any).responseSchema} as any);
        attempts.push({providerId,ok:true,error:null});
        return {ok:true,providerId,sessionId:session.id,output,attempts};
      }catch(error:any){
        const message=String(error?.message||error);
        attempts.push({providerId,ok:false,error:message});
        excluded.push(providerId);
        if(isUnconfiguredProviderError(message))continue;
      }
    }

    return {ok:false,providerId:null,sessionId:null,output:null,attempts};
  }


  async stream(request:ProviderExecutionRequest){
    const decision=await this.route(request.route||{});
    if(!decision.providerId)throw new Error("No provider available for streaming.");
    const providerId=decision.providerId;
    const adapter=this.adapters.get(providerId);
    if(!adapter)throw new Error(`Provider adapter is not registered: ${providerId}`);

    const {streamId,controller}=this.streams.create(providerId);
    const session=await adapter.createSession({model:request.model,system:request.system});
    const now=()=>new Date().toISOString();
    this.streams.emit({type:"stream.started",streamId,providerId,sessionId:session.id,model:request.model||null,at:now()});

    const run=async()=>{
      try{
        if(adapter.streamTask){
          await adapter.streamTask(
            session.id,
            {prompt:request.prompt,system:request.system,model:request.model,tools:request.tools,responseSchema:request.responseSchema} as any,
            {signal:controller.signal,streamId,emit:(event:any)=>this.streams.emit(event)}
          );
        }else{
          const output:any=await adapter.sendTask(session.id,{
            prompt:request.prompt,system:request.system,model:request.model,tools:request.tools,responseSchema:request.responseSchema
          } as any);
          const normalized=outputToStreamChunks(output);
          if(normalized.text)this.streams.emit({type:"stream.text.delta",streamId,providerId,delta:normalized.text,at:now()});
          for(const tool of normalized.toolCalls){
            this.streams.emit({type:"stream.tool.started",streamId,providerId,tool:{id:tool.id,name:tool.name},at:now()});
            this.streams.emit({type:"stream.tool.completed",streamId,providerId,tool,at:now()});
          }
          this.streams.emit({type:"stream.usage",streamId,providerId,usage:normalized.usage,at:now()});
          this.streams.emit({type:"stream.completed",streamId,providerId,finishReason:normalized.finishReason,at:now()});
        }
      }catch(error:any){
        if(controller.signal.aborted)this.streams.emit({type:"stream.cancelled",streamId,providerId,at:now()});
        else this.streams.emit({type:"stream.failed",streamId,providerId,error:String(error?.message||error),at:now()});
      }finally{
        this.streams.close(streamId);
      }
    };
    void run();
    return {streamId,providerId,sessionId:session.id};
  }

  cancelStream(streamId:string){return this.streams.cancel(streamId);}

  credentialSummary(){
    return this.manifests().map(manifest=>({
      id:manifest.id,
      credential:maskedCredentialState(manifest),
      endpoint:providerEndpoint(manifest)
    }));
  }
}
