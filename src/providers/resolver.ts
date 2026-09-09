import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {execFileSync} from "node:child_process";
import type {ProviderDefinition,ProviderId} from "./types";
import {ProviderRegistry} from "./registry";

function unique<T>(rows:T[]){return [...new Set(rows)];}

function windowsCandidates(name:string){
  const home=os.homedir();
  const local=process.env.LOCALAPPDATA||path.join(home,"AppData","Local");
  const roaming=process.env.APPDATA||path.join(home,"AppData","Roaming");
  const list=[
    path.join(local,"Programs",name,name+".exe"),
    path.join(local,name,name+".exe"),
    path.join(roaming,"npm",name+".cmd"),
    path.join(home,".local","bin",name+".exe"),
    path.join(home,".local","bin",name),
    path.join(home,"bin",name+".exe")
  ];
  return list;
}

export class ProviderResolver{
  private registry=new ProviderRegistry();

  resolveExecutable(id:ProviderId){
    const definition=this.registry.get(id);
    if(!definition)return null;

    const envKey=`OFFICE_${id.toUpperCase()}_EXECUTABLE`;
    const override=process.env[envKey];
    if(override&&fs.existsSync(override))return override;

    for(const candidate of definition.executableCandidates){
      if(path.isAbsolute(candidate)&&fs.existsSync(candidate))return candidate;
      try{
        const cmd=process.platform==="win32"?"where":"which";
        const found=execFileSync(cmd,[candidate],{encoding:"utf8",stdio:["ignore","pipe","ignore"]})
          .split(/\r?\n/).map(x=>x.trim()).filter(Boolean)[0];
        if(found&&fs.existsSync(found))return found;
      }catch{}
    }

    if(process.platform==="win32"){
      const names=unique(definition.executableCandidates.map(x=>x.replace(/\.(exe|cmd)$/i,"")));
      for(const name of names){
        for(const candidate of windowsCandidates(name)){
          if(fs.existsSync(candidate))return candidate;
        }
      }
    }
    return null;
  }

  definition(id:ProviderId):ProviderDefinition|null{
    return this.registry.get(id);
  }
}
