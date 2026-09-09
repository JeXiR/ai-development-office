import {BaseProviderAdapter} from "./base";
import type {ProviderHealth,ProviderManifest} from "../types";
import type {NativeTaskInput,NormalizedProviderOutput} from "../normalized";

const BASE=(process.env.ANTHROPIC_BASE_URL||"https://api.anthropic.com").replace(/\/+$/,"");

export class AnthropicAdapter extends BaseProviderAdapter{
  constructor(manifest:ProviderManifest){super(manifest);}
  private key(){return process.env.ANTHROPIC_API_KEY||null;}

  async detect(){return Boolean(this.key());}

  async health():Promise<ProviderHealth>{
    const started=Date.now();
    if(!this.key())return {providerId:this.manifest.id,available:false,latencyMs:null,checkedAt:new Date().toISOString(),detail:"ANTHROPIC_API_KEY not configured"};
    // Do not spend tokens for health. Config presence is treated as configured/unknown until a real call.
    return {providerId:this.manifest.id,available:true,latencyMs:Date.now()-started,checkedAt:new Date().toISOString(),detail:"configured"};
  }

  async models(){return [];}

  async sendTask(sessionId:string,input:NativeTaskInput):Promise<NormalizedProviderOutput>{
    this.assertSession(sessionId);
    const key=this.key();
    if(!key)throw new Error("ANTHROPIC_API_KEY is not configured.");
    const model=input.model||process.env.ANTHROPIC_MODEL||"";
    if(!model)throw new Error("ANTHROPIC_MODEL is not configured.");

    const body:any={
      model,
      max_tokens:Number(process.env.ANTHROPIC_MAX_TOKENS||4096),
      messages:[{role:"user",content:input.prompt}]
    };
    if(input.system)body.system=input.system;
    if(input.tools?.length)body.tools=input.tools.map(t=>({
      name:t.name,
      description:t.description,
      input_schema:t.inputSchema
    }));

    const res=await fetch(`${BASE}/v1/messages`,{
      method:"POST",
      headers:{
        "content-type":"application/json",
        "x-api-key":key,
        "anthropic-version":"2023-06-01"
      },
      body:JSON.stringify(body),
      signal:AbortSignal.timeout(15*60*1000)
    });
    if(!res.ok)throw new Error(`Anthropic request failed with HTTP ${res.status}`);
    const raw:any=await res.json();
    const content=Array.isArray(raw.content)?raw.content:[];
    const text=content.filter((x:any)=>x?.type==="text").map((x:any)=>String(x.text||"")).join("");
    const toolCalls=content.filter((x:any)=>x?.type==="tool_use").map((x:any)=>({
      id:String(x.id||""),
      name:String(x.name||""),
      arguments:x.input??null
    }));
    return {
      text,
      toolCalls,
      structured:null,
      finishReason:raw.stop_reason?String(raw.stop_reason):null,
      usage:{
        inputTokens:Number.isFinite(raw.usage?.input_tokens)?raw.usage.input_tokens:null,
        outputTokens:Number.isFinite(raw.usage?.output_tokens)?raw.usage.output_tokens:null,
        totalTokens:Number.isFinite(raw.usage?.input_tokens)&&Number.isFinite(raw.usage?.output_tokens)?raw.usage.input_tokens+raw.usage.output_tokens:null,
        reasoningTokens:null,
        costUsd:null
      },
      raw
    };
  }
  async streamTask(sessionId:string,input:NativeTaskInput,ctx:{signal:AbortSignal;emit:(e:any)=>void;streamId:string}){
    this.assertSession(sessionId);
    const key=this.key(); if(!key)throw new Error("ANTHROPIC_API_KEY is not configured.");
    const model=input.model||process.env.ANTHROPIC_MODEL||""; if(!model)throw new Error("ANTHROPIC_MODEL is not configured.");
    const body:any={model,max_tokens:Number(process.env.ANTHROPIC_MAX_TOKENS||4096),messages:[{role:"user",content:input.prompt}],stream:true};
    if(input.system)body.system=input.system;
    if(input.tools?.length)body.tools=input.tools.map(t=>({name:t.name,description:t.description,input_schema:t.inputSchema}));
    const res=await fetch(`${BASE}/v1/messages`,{method:"POST",headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"},body:JSON.stringify(body),signal:ctx.signal});
    if(!res.ok||!res.body)throw new Error(`Anthropic stream failed with HTTP ${res.status}`);
    const reader=res.body.getReader(),decoder=new TextDecoder(); let buffer="";
    while(true){
      const {done,value}=await reader.read(); if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      const lines=buffer.split("\n"); buffer=lines.pop()||"";
      for(const line of lines){
        if(!line.startsWith("data:"))continue;
        const raw=line.slice(5).trim(); if(!raw)continue;
        let e:any; try{e=JSON.parse(raw);}catch{continue}
        if(e.type==="content_block_delta"&&e.delta?.type==="text_delta"&&e.delta.text)ctx.emit({type:"stream.text.delta",streamId:ctx.streamId,providerId:this.manifest.id,delta:String(e.delta.text),at:new Date().toISOString()});
        if(e.type==="message_delta"&&e.usage)ctx.emit({type:"stream.usage",streamId:ctx.streamId,providerId:this.manifest.id,usage:{inputTokens:null,outputTokens:e.usage.output_tokens??null,totalTokens:null,reasoningTokens:null,costUsd:null},at:new Date().toISOString()});
        if(e.type==="message_stop")ctx.emit({type:"stream.completed",streamId:ctx.streamId,providerId:this.manifest.id,finishReason:null,at:new Date().toISOString()});
      }
    }
  }
}
