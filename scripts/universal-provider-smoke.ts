import {UniversalProviderRuntime} from "../src/provider-sdk/runtime";
import type {ProviderHealth,ProviderManifest,UniversalProviderAdapter} from "../src/provider-sdk/types";

const manifest=(id:any,name:string,available:boolean):ProviderManifest=>({
  id,name,transport:"native-api",
  capabilities:{coding:true,reasoning:true,toolCalling:true,structuredOutput:true,vision:false,streaming:true,sessionResume:true,local:false}
});

class FakeAdapter implements UniversalProviderAdapter{
  manifest:ProviderManifest;
  constructor(id:any,name:string,private available:boolean,private fail:boolean){
    this.manifest=manifest(id,name,available);
  }
  async detect(){return this.available;}
  async health():Promise<ProviderHealth>{return {providerId:this.manifest.id,available:this.available,latencyMs:1,checkedAt:new Date().toISOString(),detail:this.available?"ok":"down"};}
  async models(){return this.available?["test-model"]:[];}
  async createSession(){return {id:`${this.manifest.id}-session`};}
  async resumeSession(id:string){return {id};}
  async sendTask(_id:string,input:{prompt:string}){if(this.fail)throw new Error("synthetic failure");return {text:`done:${input.prompt}`};}
  async cancel(){return;}
  async usage(){return {inputTokens:null,outputTokens:null,costUsd:null};}
}

const first=new FakeAdapter("openai","OpenAI",true,true);
const second=new FakeAdapter("groq","Groq",true,false);
const runtime=new UniversalProviderRuntime([first,second]);

const state=await runtime.state();
if(state.length<9)throw new Error(`Expected manifest state for all providers, got ${state.length}`);

const route=await runtime.route({requires:["coding","reasoning"],preferredProvider:"openai"});
if(route.providerId!=="openai")throw new Error(`Expected OpenAI route, got ${route.providerId}`);

const result=await runtime.execute({
  prompt:"hello",
  route:{requires:["coding","reasoning"],preferredProvider:"openai"}
});
if(!result.ok)throw new Error("Execution did not recover through failover");
if(result.providerId!=="groq")throw new Error(`Expected failover to Groq, got ${result.providerId}`);
if(result.attempts.length!==2)throw new Error(`Expected 2 attempts, got ${result.attempts.length}`);
if(result.attempts[0].ok)throw new Error("First synthetic provider should fail");
if(!result.attempts[1].ok)throw new Error("Second synthetic provider should succeed");

console.log("Universal Provider smoke PASS");
console.log(JSON.stringify({route:route.providerId,final:result.providerId,attempts:result.attempts},null,2));
