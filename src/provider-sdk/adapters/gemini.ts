import {BaseProviderAdapter} from "./base";
import type {ProviderHealth,ProviderManifest} from "../types";
import type {NativeTaskInput,NormalizedProviderOutput} from "../normalized";

const BASE=(process.env.GEMINI_BASE_URL||"https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/,"");

export class GeminiAdapter extends BaseProviderAdapter{
  constructor(manifest:ProviderManifest){super(manifest);}
  private key(){return process.env.GEMINI_API_KEY||null;}

  async detect(){return Boolean(this.key());}

  async health():Promise<ProviderHealth>{
    const started=Date.now();
    const key=this.key();
    if(!key)return {providerId:this.manifest.id,available:false,latencyMs:null,checkedAt:new Date().toISOString(),detail:"GEMINI_API_KEY not configured"};
    try{
      const res=await fetch(`${BASE}/models?key=${encodeURIComponent(key)}`,{signal:AbortSignal.timeout(6000)});
      return {providerId:this.manifest.id,available:res.ok,latencyMs:Date.now()-started,checkedAt:new Date().toISOString(),detail:`HTTP ${res.status}`};
    }catch(error:any){
      return {providerId:this.manifest.id,available:false,latencyMs:Date.now()-started,checkedAt:new Date().toISOString(),detail:String(error?.message||error)};
    }
  }

  async models(){
    const key=this.key(); if(!key)return [];
    try{
      const res=await fetch(`${BASE}/models?key=${encodeURIComponent(key)}`,{signal:AbortSignal.timeout(6000)});
      if(!res.ok)return [];
      const data:any=await res.json();
      return Array.isArray(data?.models)?data.models.map((x:any)=>String(x.name||"").replace(/^models\//,"")).filter(Boolean):[];
    }catch{return [];}
  }

  async sendTask(sessionId:string,input:NativeTaskInput):Promise<NormalizedProviderOutput>{
    this.assertSession(sessionId);
    const key=this.key();
    if(!key)throw new Error("GEMINI_API_KEY is not configured.");
    const model=input.model||process.env.GEMINI_MODEL||"";
    if(!model)throw new Error("GEMINI_MODEL is not configured.");

    const body:any={
      contents:[{role:"user",parts:[{text:input.prompt}]}]
    };
    if(input.system)body.systemInstruction={parts:[{text:input.system}]};
    if(input.tools?.length){
      body.tools=[{functionDeclarations:input.tools.map(t=>({
        name:t.name,
        description:t.description,
        parameters:t.inputSchema
      }))}];
    }
    if(input.responseSchema){
      body.generationConfig={
        responseMimeType:"application/json",
        responseSchema:input.responseSchema
      };
    }

    const res=await fetch(`${BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(body),
      signal:AbortSignal.timeout(15*60*1000)
    });
    if(!res.ok)throw new Error(`Gemini request failed with HTTP ${res.status}`);
    const raw:any=await res.json();
    const candidate=raw?.candidates?.[0]||{};
    const parts=Array.isArray(candidate?.content?.parts)?candidate.content.parts:[];
    const text=parts.filter((p:any)=>typeof p?.text==="string").map((p:any)=>p.text).join("");
    const toolCalls=parts.filter((p:any)=>p?.functionCall).map((p:any,index:number)=>({
      id:`gemini-${index}`,
      name:String(p.functionCall.name||""),
      arguments:p.functionCall.args??null
    }));
    let structured:null|unknown=null;
    if(input.responseSchema&&text){
      try{structured=JSON.parse(text);}catch{}
    }
    const usage=raw?.usageMetadata||{};
    return {
      text,
      toolCalls,
      structured,
      finishReason:candidate?.finishReason?String(candidate.finishReason):null,
      usage:{
        inputTokens:Number.isFinite(usage.promptTokenCount)?usage.promptTokenCount:null,
        outputTokens:Number.isFinite(usage.candidatesTokenCount)?usage.candidatesTokenCount:null,
        totalTokens:Number.isFinite(usage.totalTokenCount)?usage.totalTokenCount:null,
        reasoningTokens:Number.isFinite(usage.thoughtsTokenCount)?usage.thoughtsTokenCount:null,
        costUsd:null
      },
      raw
    };
  }
  async streamTask(sessionId:string,input:NativeTaskInput,ctx:{signal:AbortSignal;emit:(e:any)=>void;streamId:string}){
    this.assertSession(sessionId);
    const key=this.key(); if(!key)throw new Error("GEMINI_API_KEY is not configured.");
    const model=input.model||process.env.GEMINI_MODEL||""; if(!model)throw new Error("GEMINI_MODEL is not configured.");
    const body:any={contents:[{role:"user",parts:[{text:input.prompt}]}]};
    if(input.system)body.systemInstruction={parts:[{text:input.system}]};
    const res=await fetch(`${BASE}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),signal:ctx.signal});
    if(!res.ok||!res.body)throw new Error(`Gemini stream failed with HTTP ${res.status}`);
    const reader=res.body.getReader(),decoder=new TextDecoder(); let buffer="";
    while(true){
      const {done,value}=await reader.read(); if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      const lines=buffer.split("\n"); buffer=lines.pop()||"";
      for(const line of lines){
        if(!line.startsWith("data:"))continue;
        const raw=line.slice(5).trim(); let e:any; try{e=JSON.parse(raw);}catch{continue}
        const candidate=e?.candidates?.[0],parts=Array.isArray(candidate?.content?.parts)?candidate.content.parts:[];
        for(const p of parts)if(typeof p?.text==="string")ctx.emit({type:"stream.text.delta",streamId:ctx.streamId,providerId:this.manifest.id,delta:p.text,at:new Date().toISOString()});
        if(e?.usageMetadata)ctx.emit({type:"stream.usage",streamId:ctx.streamId,providerId:this.manifest.id,usage:{inputTokens:e.usageMetadata.promptTokenCount??null,outputTokens:e.usageMetadata.candidatesTokenCount??null,totalTokens:e.usageMetadata.totalTokenCount??null,reasoningTokens:e.usageMetadata.thoughtsTokenCount??null,costUsd:null},at:new Date().toISOString()});
        if(candidate?.finishReason)ctx.emit({type:"stream.completed",streamId:ctx.streamId,providerId:this.manifest.id,finishReason:String(candidate.finishReason),at:new Date().toISOString()});
      }
    }
  }
}
