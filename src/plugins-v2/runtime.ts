import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import type {PluginHook,PluginInvocationContext,PluginInvocationResult,PluginManifestV2,PluginRuntimeState} from "./types";
import {PluginPermissionService} from "./permissions";

type PluginModule={
  activate?:(api:PluginApi)=>void|Promise<void>;
  deactivate?:()=>void|Promise<void>;
  hooks?:Partial<Record<PluginHook,(ctx:PluginInvocationContext,api:PluginApi)=>unknown|Promise<unknown>>>;
};

export type PluginApi={
  readText:(relativePath:string)=>string;
  writeText:(relativePath:string,text:string)=>void;
  fetchJson:(url:string,init?:RequestInit)=>Promise<unknown>;
  log:(message:string)=>void;
};

export class PluginRuntimeV2{
  private permissions=new PluginPermissionService();
  private modules=new Map<string,PluginModule>();

  constructor(private readonly officeRoot:string){}

  private entryPath(manifest:PluginManifestV2){
    const pluginRoot=path.resolve(this.officeRoot,"plugins",manifest.id);
    const entry=path.resolve(pluginRoot,manifest.entry);
    if(entry!==pluginRoot&&!entry.startsWith(pluginRoot+path.sep))throw new Error("Plugin entry escapes plugin root.");
    return entry;
  }

  private api(manifest:PluginManifestV2,ctx:PluginInvocationContext):PluginApi{
    return {
      readText:(relativePath)=>{
        this.permissions.assert(manifest,"read_project");
        return fs.readFileSync(this.permissions.resolveProjectPath(ctx.projectPath,relativePath),"utf8");
      },
      writeText:(relativePath,text)=>{
        this.permissions.assert(manifest,"write_project");
        const file=this.permissions.resolveProjectPath(ctx.projectPath,relativePath);
        fs.mkdirSync(path.dirname(file),{recursive:true});
        fs.writeFileSync(file,text,"utf8");
      },
      fetchJson:async(url,init)=>{
        this.permissions.assert(manifest,"network");
        if(!/^https?:\/\//i.test(url))throw new Error("Only http/https plugin requests are allowed.");
        const response=await fetch(url,{...init,signal:AbortSignal.timeout(15000)});
        const text=await response.text();
        try{return JSON.parse(text);}catch{return text;}
      },
      log:(message)=>console.log(`[plugin:${manifest.id}] ${message}`)
    };
  }

  async load(manifest:PluginManifestV2){
    if(this.modules.has(manifest.id))return this.modules.get(manifest.id)!;
    const entry=this.entryPath(manifest);
    if(!fs.existsSync(entry))throw new Error(`Plugin entry not found: ${entry}`);
    const mod=(await import(pathToFileURL(entry).href+`?v=${Date.now()}`)) as PluginModule;
    this.modules.set(manifest.id,mod);
    return mod;
  }

  async invoke(manifest:PluginManifestV2,state:PluginRuntimeState,ctx:PluginInvocationContext):Promise<PluginInvocationResult>{
    const started=Date.now();
    if(!state.enabled)return {ok:false,pluginId:manifest.id,hook:ctx.hook,durationMs:0,data:null,error:"Plugin disabled."};
    if(!manifest.hooks.includes(ctx.hook))return {ok:false,pluginId:manifest.id,hook:ctx.hook,durationMs:0,data:null,error:"Hook not declared."};

    try{
      state.status="running";
      const mod=await this.load(manifest);
      const fn=mod.hooks?.[ctx.hook];
      if(!fn)throw new Error("Declared hook has no runtime handler.");
      const data=await Promise.race([
        Promise.resolve(fn(ctx,this.api(manifest,ctx))),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error("Plugin hook timeout.")),15000))
      ]);
      state.status="idle";state.lastError=null;state.lastRunAt=new Date().toISOString();
      return {ok:true,pluginId:manifest.id,hook:ctx.hook,durationMs:Date.now()-started,data,error:null};
    }catch(error){
      state.status="failed";state.failureCount++;state.lastError=error instanceof Error?error.message:String(error);state.lastRunAt=new Date().toISOString();
      if(state.failureCount>=3){state.enabled=false;state.status="disabled";}
      return {ok:false,pluginId:manifest.id,hook:ctx.hook,durationMs:Date.now()-started,data:null,error:state.lastError};
    }
  }
}
