import {UniversalProviderRuntime} from "../src/provider-sdk/runtime";

let runtime:UniversalProviderRuntime|null=null;

export function getUniversalProviderRuntime(){
  if(!runtime)runtime=new UniversalProviderRuntime();
  return runtime;
}

export async function universalProviderSnapshot(){
  const r=getUniversalProviderRuntime();
  return {
    providers:await r.state(),
    credentials:r.credentialSummary()
  };
}

export async function universalProviderRoute(data:any){
  return getUniversalProviderRuntime().route(data||{});
}

export async function universalProviderExecute(data:any){
  return getUniversalProviderRuntime().execute({
    prompt:String(data?.prompt||""),
    system:data?.system?String(data.system):undefined,
    model:data?.model?String(data.model):undefined,
    tools:Array.isArray(data?.tools)?data.tools:undefined,
    responseSchema:data?.responseSchema&&typeof data.responseSchema==="object"?data.responseSchema:undefined,
    route:data?.route||{}
  });
}


export async function universalProviderStream(data:any){
  return getUniversalProviderRuntime().stream({
    prompt:String(data?.prompt||""),
    system:data?.system?String(data.system):undefined,
    model:data?.model?String(data.model):undefined,
    tools:Array.isArray(data?.tools)?data.tools:undefined,
    responseSchema:data?.responseSchema&&typeof data.responseSchema==="object"?data.responseSchema:undefined,
    route:data?.route||{}
  });
}

export function cancelUniversalProviderStream(streamId:string){
  return getUniversalProviderRuntime().cancelStream(streamId);
}

export function subscribeUniversalProviderStream(listener:(event:any)=>void){
  return getUniversalProviderRuntime().streams.subscribe(listener);
}
