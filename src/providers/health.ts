import {spawnSync} from "node:child_process";
import type {ProviderHealth,ProviderId} from "./types";
import {ProviderRegistry} from "./registry";
import {ProviderResolver} from "./resolver";

function now(){return new Date().toISOString();}

export class ProviderHealthMonitor{
  private registry=new ProviderRegistry();
  private resolver=new ProviderResolver();
  private cache=new Map<ProviderId,ProviderHealth>();

  check(id:ProviderId):ProviderHealth{
    const executable=this.resolver.resolveExecutable(id);
    if(!executable){
      const health:ProviderHealth={provider:id,status:"unavailable",checkedAt:now(),latencyMs:null,executable:null,message:"Executable not found."};
      this.cache.set(id,health);
      return health;
    }

    const started=Date.now();
    let status:"healthy"|"degraded"="healthy";
    let message="Executable detected.";
    try{
      const result=spawnSync(executable,["--version"],{encoding:"utf8",timeout:4000,windowsHide:true});
      if(result.error){
        status="degraded";
        message=result.error.message;
      }else if(typeof result.status==="number"&&result.status!==0){
        status="degraded";
        message=(result.stderr||result.stdout||"Version check returned non-zero.").trim().slice(0,300);
      }else{
        message=(result.stdout||result.stderr||"Executable detected.").trim().slice(0,300)||"Executable detected.";
      }
    }catch(error){
      status="degraded";
      message=error instanceof Error?error.message:String(error);
    }

    const health:ProviderHealth={
      provider:id,
      status,
      checkedAt:now(),
      latencyMs:Date.now()-started,
      executable,
      message
    };
    this.cache.set(id,health);
    return health;
  }

  checkAll(){
    return this.registry.list().map(x=>this.check(x.id));
  }

  snapshot(){
    return this.registry.list().map(def=>this.cache.get(def.id)||{
      provider:def.id,status:"unknown",checkedAt:now(),latencyMs:null,executable:null,message:"Not checked yet."
    } as ProviderHealth);
  }
}
