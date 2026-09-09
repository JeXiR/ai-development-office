import {maskSecrets} from "@/safety-v2/secrets";
import type {IntegrationActionResult} from "./types";

export async function integrationFetch(input:{
  url:string; method?:string; headers?:Record<string,string>; body?:unknown; attempt:number;
}):Promise<IntegrationActionResult>{
  const started=Date.now();
  try{
    const response=await fetch(input.url,{
      method:input.method||"GET",
      headers:input.headers,
      body:input.body===undefined?undefined:JSON.stringify(input.body),
      signal:AbortSignal.timeout(15000)
    });
    const text=await response.text();
    let data:unknown=text;
    try{data=text?JSON.parse(text):null;}catch{}
    return {
      ok:response.ok,status:response.status,data,
      message:response.ok?"OK":maskSecrets(text.slice(0,1000)||`HTTP ${response.status}`),
      attempt:input.attempt,durationMs:Date.now()-started
    };
  }catch(error){
    return {ok:false,status:null,data:null,message:maskSecrets(error instanceof Error?error.message:String(error)),attempt:input.attempt,durationMs:Date.now()-started};
  }
}
