import {BaseProviderAdapter} from "./base";
import type {ProviderHealth,ProviderManifest} from "../types";

export class OllamaAdapter extends BaseProviderAdapter{
  constructor(manifest:ProviderManifest,private readonly baseUrl=process.env.OLLAMA_HOST||"http://127.0.0.1:11434"){super(manifest);}

  async detect(){
    const health=await this.health();
    return health.available;
  }

  async health():Promise<ProviderHealth>{
    const started=Date.now();
    try{
      const res=await fetch(`${this.baseUrl.replace(/\/+$/,"")}/api/tags`,{signal:AbortSignal.timeout(3000)});
      return {providerId:this.manifest.id,available:res.ok,latencyMs:Date.now()-started,checkedAt:new Date().toISOString(),detail:res.ok?"Ollama reachable":`HTTP ${res.status}`};
    }catch(error:any){
      return {providerId:this.manifest.id,available:false,latencyMs:Date.now()-started,checkedAt:new Date().toISOString(),detail:String(error?.message||error)};
    }
  }

  async models(){
    try{
      const res=await fetch(`${this.baseUrl.replace(/\/+$/,"")}/api/tags`,{signal:AbortSignal.timeout(3000)});
      if(!res.ok)return [];
      const data:any=await res.json();
      return Array.isArray(data?.models)?data.models.map((m:any)=>String(m.name)).filter(Boolean):[];
    }catch{return [];}
  }

  async sendTask(sessionId:string,input:{prompt:string}){
    this.assertSession(sessionId);
    const model=process.env.OLLAMA_MODEL||"";
    if(!model)throw new Error("OLLAMA_MODEL is not configured.");
    const res=await fetch(`${this.baseUrl.replace(/\/+$/,"")}/api/generate`,{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({model,prompt:input.prompt,stream:false}),
      signal:AbortSignal.timeout(15*60*1000)
    });
    if(!res.ok)throw new Error(`Ollama request failed with HTTP ${res.status}`);
    return res.json();
  }
}
