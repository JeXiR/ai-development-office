import {UniversalProviderRuntime} from "../src/provider-sdk/runtime";
import type {ProviderHealth,ProviderManifest,UniversalProviderAdapter} from "../src/provider-sdk/types";

const manifest:ProviderManifest={
  id:"groq",name:"Synthetic",transport:"native-api",
  capabilities:{coding:true,reasoning:true,toolCalling:true,structuredOutput:true,vision:false,streaming:true,sessionResume:true,local:false}
};

class StreamAdapter implements UniversalProviderAdapter{
  manifest=manifest;
  async detect(){return true;}
  async health():Promise<ProviderHealth>{return {providerId:"groq",available:true,latencyMs:1,checkedAt:new Date().toISOString(),detail:"ok"};}
  async models(){return ["synthetic"];}
  async createSession(){return {id:"s1"};}
  async resumeSession(id:string){return {id};}
  async sendTask(){return {text:"fallback",toolCalls:[],structured:null,finishReason:"stop",usage:{inputTokens:1,outputTokens:1,totalTokens:2,reasoningTokens:null,costUsd:null},raw:null};}
  async streamTask(_sessionId:string,_input:any,ctx:any){
    ctx.emit({type:"stream.text.delta",streamId:ctx.streamId,providerId:"groq",delta:"hel",at:new Date().toISOString()});
    ctx.emit({type:"stream.text.delta",streamId:ctx.streamId,providerId:"groq",delta:"lo",at:new Date().toISOString()});
    ctx.emit({type:"stream.usage",streamId:ctx.streamId,providerId:"groq",usage:{inputTokens:1,outputTokens:2,totalTokens:3,reasoningTokens:null,costUsd:null},at:new Date().toISOString()});
    ctx.emit({type:"stream.completed",streamId:ctx.streamId,providerId:"groq",finishReason:"stop",at:new Date().toISOString()});
  }
  async cancel(){}
  async usage(){return {inputTokens:null,outputTokens:null,costUsd:null};}
}

const runtime=new UniversalProviderRuntime([new StreamAdapter()]);
const events:any[]=[];
const unsub=runtime.streams.subscribe(e=>events.push(e));
const started=await runtime.stream({prompt:"hello",route:{preferredProvider:"groq",requires:["coding"]}});
await new Promise(r=>setTimeout(r,30));
unsub();

if(!started.streamId)throw new Error("stream id missing");
if(!events.find(e=>e.type==="stream.started"))throw new Error("stream.started missing");
if(events.filter(e=>e.type==="stream.text.delta").map(e=>e.delta).join("")!=="hello")throw new Error("text deltas failed");
if(!events.find(e=>e.type==="stream.usage"))throw new Error("usage event missing");
if(!events.find(e=>e.type==="stream.completed"))throw new Error("completed event missing");

console.log("Provider Streaming smoke PASS");
