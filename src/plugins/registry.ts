import fs from "node:fs";
import path from "node:path";
import type {OfficePluginManifest,PluginHook} from "./types";

export type LoadedPlugin={
  manifest:OfficePluginManifest;
  root:string;
  enabled:boolean;
  errors:string[];
};

export class PluginRegistry{
  discover(officeRoot:string){
    const dir=path.join(officeRoot,"plugins");
    if(!fs.existsSync(dir))return [] as LoadedPlugin[];
    const rows:LoadedPlugin[]=[];
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      if(!entry.isDirectory())continue;
      const root=path.join(dir,entry.name);
      const manifestFile=path.join(root,"plugin.json");
      try{
        const manifest=JSON.parse(fs.readFileSync(manifestFile,"utf8")) as OfficePluginManifest;
        rows.push({manifest,root,enabled:true,errors:[]});
      }catch(error){
        rows.push({
          manifest:{id:entry.name,name:entry.name,version:"0.0.0",description:"Invalid plugin",permissions:[],entry:""},
          root,enabled:false,errors:[error instanceof Error?error.message:String(error)]
        });
      }
    }
    return rows;
  }

  validateManifest(manifest:OfficePluginManifest){
    const errors:string[]=[];
    if(!manifest.id?.trim())errors.push("Missing plugin id.");
    if(!manifest.name?.trim())errors.push("Missing plugin name.");
    if(!manifest.version?.trim())errors.push("Missing plugin version.");
    if(!manifest.entry?.trim())errors.push("Missing plugin entry.");
    return errors;
  }
}
