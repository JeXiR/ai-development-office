import {PluginRegistryV2} from "./registry";
import {PluginRuntimeV2} from "./runtime";
import {resolvePluginContributions} from "./contributions";
import type {PluginHook,PluginInvocationContext} from "./types";

export class PluginManagerV2{
  private registry=new PluginRegistryV2();
  private runtime:PluginRuntimeV2;

  constructor(private readonly officeRoot:string){
    this.runtime=new PluginRuntimeV2(officeRoot);
  }

  snapshot(projectPath:string){
    const manifests=this.registry.discover(this.officeRoot);
    const states=this.registry.states(projectPath,manifests);
    return {manifests,states,contributions:resolvePluginContributions(manifests,states)};
  }

  setEnabled(projectPath:string,id:string,enabled:boolean){
    const manifests=this.registry.discover(this.officeRoot);
    return this.registry.setEnabled(projectPath,manifests,id,enabled);
  }

  async invoke(projectPath:string,ctx:PluginInvocationContext){
    const manifests=this.registry.discover(this.officeRoot);
    const states=this.registry.states(projectPath,manifests);
    const results=[];
    for(const manifest of manifests.filter(x=>x.hooks.includes(ctx.hook))){
      const state=states.find(x=>x.id===manifest.id)!;
      results.push(await this.runtime.invoke(manifest,state,ctx));
    }
    this.registry.saveStates(projectPath,states);
    return results;
  }

  async fire(projectPath:string,hook:PluginHook,ctx:Omit<PluginInvocationContext,"hook">){
    return this.invoke(projectPath,{...ctx,hook});
  }
}
