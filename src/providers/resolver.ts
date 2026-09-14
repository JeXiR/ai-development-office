import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type {ProviderDefinition,ProviderId} from "./types";
import {ProviderRegistry} from "./registry";
import {collectWhereHits,preferWindowsCli} from "./win-cli";

function unique<T>(rows:T[]){return [...new Set(rows)];}

function grokHomeBin(file:string){
  return /(?:^|[/\\])\.grok[/\\]bin[/\\]/i.test(file.replace(/\\/g,"/"));
}

export function keepResolvedExecutable(id:ProviderId, file:string){
  if(!file)return false;
  if(id!=="grok"&&grokHomeBin(file))return false;
  return true;
}

function windowsCandidates(id:ProviderId, name:string){
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
  if(id==="grok"){
    list.push(path.join(home,".grok","bin","grok.exe"), path.join(home,".grok","bin","grok"));
  }
  if(id==="cursor"&&(name==="agent"||name==="cursor-agent")){
    list.push(path.join(local,"cursor-agent","agent.cmd"), path.join(local,"cursor-agent","cursor-agent.cmd"));
  }
  return list;
}

function pickExecutable(id:ProviderId, hits:string[]){
  const existing=hits.filter(file=>file&&fs.existsSync(file)&&keepResolvedExecutable(id,file));
  if(id==="cursor"){
    const dedicated=existing.filter(file=>/cursor-agent/i.test(file));
    if(dedicated.length)return preferWindowsCli(dedicated);
  }
  return preferWindowsCli(existing);
}

export class ProviderResolver{
  private registry=new ProviderRegistry();

  resolveExecutable(id:ProviderId){
    const definition=this.registry.get(id);
    if(!definition)return null;

    const envKey=`OFFICE_${id.toUpperCase()}_EXECUTABLE`;
    const override=process.env[envKey];
    if(override&&fs.existsSync(override)&&keepResolvedExecutable(id,override))return override;

    const hits:string[]=[];
    for(const candidate of definition.executableCandidates){
      if(path.isAbsolute(candidate)&&fs.existsSync(candidate))hits.push(candidate);
      hits.push(...collectWhereHits(candidate));
    }

    if(process.platform==="win32"){
      const names=unique(definition.executableCandidates.map(x=>x.replace(/\.(exe|cmd|ps1)$/i,"")));
      for(const name of names)hits.push(...windowsCandidates(id,name));
    }

    return pickExecutable(id, hits);
  }

  definition(id:ProviderId):ProviderDefinition|null{
    return this.registry.get(id);
  }
}
