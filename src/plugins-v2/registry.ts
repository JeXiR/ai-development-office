import fs from "node:fs";
import path from "node:path";
import {atomicWriteJson} from "@/recovery/atomic-write";
import {PLUGIN_API_VERSION,type PluginManifestV2,type PluginRuntimeState} from "./types";

export class PluginRegistryV2{
  discover(officeRoot:string):PluginManifestV2[]{
    const dir=path.join(officeRoot,"plugins");
    if(!fs.existsSync(dir))return [];
    const manifests:PluginManifestV2[]=[];
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      if(!entry.isDirectory())continue;
      const file=path.join(dir,entry.name,"plugin.json");
      if(!fs.existsSync(file))continue;
      try{
        const raw=JSON.parse(fs.readFileSync(file,"utf8"));
        if(raw.apiVersion!==PLUGIN_API_VERSION)continue;
        if(!raw.id||!raw.name||!raw.entry)continue;
        manifests.push(raw as PluginManifestV2);
      }catch{}
    }
    return manifests;
  }

  private stateFile(projectPath:string){return path.join(projectPath,".ai-kit","plugins","state.json");}

  states(projectPath:string,manifests:PluginManifestV2[]):PluginRuntimeState[]{
    let persisted:PluginRuntimeState[]=[];
    try{
      const raw=JSON.parse(fs.readFileSync(this.stateFile(projectPath),"utf8"));
      if(Array.isArray(raw))persisted=raw;
    }catch{}
    return manifests.map(m=>{
      const old=persisted.find(x=>x.id===m.id);
      return old||{
        id:m.id,enabled:m.enabledByDefault,status:m.enabledByDefault?"idle":"disabled",
        failureCount:0,lastError:null,lastRunAt:null
      };
    });
  }

  saveStates(projectPath:string,states:PluginRuntimeState[]){
    atomicWriteJson(this.stateFile(projectPath),states);
  }

  setEnabled(projectPath:string,manifests:PluginManifestV2[],id:string,enabled:boolean){
    const states=this.states(projectPath,manifests);
    const row=states.find(x=>x.id===id);
    if(!row)throw new Error("Plugin not found.");
    row.enabled=enabled;
    row.status=enabled?"idle":"disabled";
    this.saveStates(projectPath,states);
    return row;
  }
}
