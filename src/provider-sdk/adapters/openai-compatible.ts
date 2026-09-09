import {BaseProviderAdapter} from "./base";
import {providerConfigured,providerEndpoint} from "../config";
import type {ProviderHealth,ProviderManifest} from "../types";

type CompatOptions={
  defaultBaseUrl?:string;
  credentialEnv?:string;
  modelEnv?:string;
};

function join(base:string,path:string){
  return base.replace(/\/+$/,"")+"/"+path.replace(/^\/+/,"");
}

export class OpenAICompatibleAdapter extends BaseProviderAdapter{
  constructor(manifest:ProviderManifest,private readonly options:CompatOptions={}){
    super(manifest);
  }

  private baseUrl(){
    return providerEndpoint(this.manifest)||this.options.defaultBaseUrl||null;
  }

  private apiKey(){
    const env=this.manifest.credentialEnv||this.options.credentialEnv;
    return env?(process.env[env]||null):null;
  }

  async detect(){return providerConfigured(this.manifest)&&Boolean(this.baseUrl());}

  async health():Promise<ProviderHealth>{
    const started=Date.now();
    const base=this.baseUrl();
    if(!base)return {providerId:this.manifest.id,available:false,latencyMs:null,checkedAt:new Date().toISOString(),detail:"Endpoint is not configured"};
    try{
      const headers:Record<string,string>={};
      const key=this.apiKey();
      if(key)headers.Authorization=`Bearer ${key}`;
      const res=await fetch(join(base,"models"),{headers,signal:AbortSignal.timeout(6000)});
      return {
        providerId:this.manifest.id,
        available:res.ok,
        latencyMs:Date.now()-started,
        checkedAt:new Date().toISOString(),
        detail:res.ok?`HTTP ${res.status}`:`HTTP ${res.status}`
      };
    }catch(error:any){
      return {providerId:this.manifest.id,available:false,latencyMs:Date.now()-started,checkedAt:new Date().toISOString(),detail:String(error?.message||error)};
    }
  }

  async models(){
    const base=this.baseUrl();
    if(!base)return [];
    try{
      const headers:Record<string,string>={};
      const key=this.apiKey();
      if(key)headers.Authorization=`Bearer ${key}`;
      const res=await fetch(join(base,"models"),{headers,signal:AbortSignal.timeout(6000)});
      if(!res.ok)return [];
      const data:any=await res.json();
      return Array.isArray(data?.data)?data.data.map((x:any)=>String(x.id)).filter(Boolean):[];
    }catch{return [];}
  }

  async sendTask(sessionId:string,input:{prompt:string}){
    this.assertSession(sessionId);
    const base=this.baseUrl();
    if(!base)throw new Error(`${this.manifest.name} endpoint is not configured.`);
    const key=this.apiKey();
    const model=(this.options.modelEnv&&process.env[this.options.modelEnv])||process.env.AI_DEFAULT_MODEL||"";
    if(!model)throw new Error(`${this.manifest.name} model is not configured.`);

    const headers:Record<string,string>={"content-type":"application/json"};
    if(key)headers.Authorization=`Bearer ${key}`;
    const res=await fetch(join(base,"chat/completions"),{
      method:"POST",
      headers,
      body:JSON.stringify({model,messages:[{role:"user",content:input.prompt}],stream:false}),
      signal:AbortSignal.timeout(15*60*1000)
    });
    if(!res.ok)throw new Error(`${this.manifest.name} request failed with HTTP ${res.status}`);
    return res.json();
  }
}
