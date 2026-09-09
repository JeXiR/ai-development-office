import {BaseProviderAdapter} from "./base";
import type {ProviderHealth,ProviderManifest} from "../types";
import type {NativeTaskInput,NormalizedProviderOutput} from "../normalized";

const BASE=(process.env.XAI_BASE_URL||"https://api.x.ai/v1").replace(/\/+$/,"");

export class XAIAdapter extends BaseProviderAdapter{
  constructor(manifest:ProviderManifest){super(manifest);}
  private key(){return process.env.XAI_API_KEY||null;}

  async detect(){return Boolean(this.key());}

  async health():Promise<ProviderHealth>{
    const started=Date.now();
    const key=this.key();
    if(!key)return {providerId:this.manifest.id,available:false,latencyMs:null,checkedAt:new Date().toISOString(),detail:"XAI_API_KEY not configured"};
    try{
      const res=await fetch(`${BASE}/models`,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(6000)});
      return {providerId:this.manifest.id,available:res.ok,latencyMs:Date.now()-started,checkedAt:new Date().toISOString(),detail:`HTTP ${res.status}`};
    }catch(error:any){
      return {providerId:this.manifest.id,available:false,latencyMs:Date.now()-started,checkedAt:new Date().toISOString(),detail:String(error?.message||error)};
    }
  }

  async models(){
    const key=this.key(); if(!key)return [];
    try{
      const res=await fetch(`${BASE}/models`,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(6000)});
      if(!res.ok)return [];
      const data:any=await res.json();
      return Array.isArray(data?.data)?data.data.map((x:any)=>String(x.id)).filter(Boolean):[];
    }catch{return [];}
  }

  async sendTask(sessionId:string,input:NativeTaskInput):Promise<NormalizedProviderOutput>{
    this.assertSession(sessionId);
    const key=this.key();
    if(!key)throw new Error("XAI_API_KEY is not configured.");
    const model=input.model||process.env.XAI_MODEL||"";
    if(!model)throw new Error("XAI_MODEL is not configured.");

    const body:any={model,input:input.prompt};
    if(input.system)body.instructions=input.system;
    if(input.tools?.length){
      body.tools=input.tools.map(t=>({
        type:"function",
        name:t.name,
        description:t.description,
        parameters:t.inputSchema
      }));
    }

    const res=await fetch(`${BASE}/responses`,{
      method:"POST",
      headers:{"content-type":"application/json",Authorization:`Bearer ${key}`},
      body:JSON.stringify(body),
      signal:AbortSignal.timeout(15*60*1000)
    });
    if(!res.ok)throw new Error(`xAI request failed with HTTP ${res.status}`);
    const raw:any=await res.json();

    const output=Array.isArray(raw?.output)?raw.output:[];
    const textParts:string[]=[];
    const toolCalls:any[]=[];
    for(const item of output){
      if(item?.type==="message"&&Array.isArray(item.content)){
        for(const c of item.content){
          if(c?.type==="output_text"&&typeof c.text==="string")textParts.push(c.text);
        }
      }
      if(item?.type==="function_call"){
        let args:any=item.arguments??null;
        if(typeof args==="string"){try{args=JSON.parse(args);}catch{}}
        toolCalls.push({id:String(item.call_id||item.id||""),name:String(item.name||""),arguments:args});
      }
    }

    const usage=raw?.usage||{};
    return {
      text:textParts.join(""),
      toolCalls,
      structured:null,
      finishReason:raw?.status?String(raw.status):null,
      usage:{
        inputTokens:Number.isFinite(usage.input_tokens)?usage.input_tokens:null,
        outputTokens:Number.isFinite(usage.output_tokens)?usage.output_tokens:null,
        totalTokens:Number.isFinite(usage.total_tokens)?usage.total_tokens:null,
        reasoningTokens:Number.isFinite(usage.output_tokens_details?.reasoning_tokens)?usage.output_tokens_details.reasoning_tokens:null,
        costUsd:null
      },
      raw
    };
  }
  async streamTask(sessionId:string,input:NativeTaskInput,ctx:{signal:AbortSignal;emit:(e:any)=>void;streamId:string}){
    this.assertSession(sessionId);
    const key=this.key(); if(!key)throw new Error("XAI_API_KEY is not configured.");
    const model=input.model||process.env.XAI_MODEL||""; if(!model)throw new Error("XAI_MODEL is not configured.");
    const body:any={model,input:input.prompt,stream:true};
    if(input.system)body.instructions=input.system;
    const res=await fetch(`${BASE}/responses`,{method:"POST",headers:{"content-type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify(body),signal:ctx.signal});
    if(!res.ok||!res.body)throw new Error(`xAI stream failed with HTTP ${res.status}`);
    const reader=res.body.getReader(),decoder=new TextDecoder(); let buffer="";
    while(true){
      const {done,value}=await reader.read(); if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      const lines=buffer.split("\n"); buffer=lines.pop()||"";
      for(const line of lines){
        if(!line.startsWith("data:"))continue;
        const raw=line.slice(5).trim(); if(raw==="[DONE]")continue;
        let e:any; try{e=JSON.parse(raw);}catch{continue}
        if(e.type==="response.output_text.delta"&&e.delta)ctx.emit({type:"stream.text.delta",streamId:ctx.streamId,providerId:this.manifest.id,delta:String(e.delta),at:new Date().toISOString()});
        if(e.type==="response.completed")ctx.emit({type:"stream.completed",streamId:ctx.streamId,providerId:this.manifest.id,finishReason:"completed",at:new Date().toISOString()});
        if(e.response?.usage)ctx.emit({type:"stream.usage",streamId:ctx.streamId,providerId:this.manifest.id,usage:{inputTokens:e.response.usage.input_tokens??null,outputTokens:e.response.usage.output_tokens??null,totalTokens:e.response.usage.total_tokens??null,reasoningTokens:e.response.usage.output_tokens_details?.reasoning_tokens??null,costUsd:null},at:new Date().toISOString()});
      }
    }
  }
}
