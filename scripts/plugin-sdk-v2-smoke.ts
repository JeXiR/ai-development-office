import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {PluginRegistryV2} from "../src/plugins-v2/registry";
import {PluginRuntimeV2} from "../src/plugins-v2/runtime";
import {resolvePluginContributions} from "../src/plugins-v2/contributions";

async function main(){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-pluginv2-"));
  const officeRoot=path.join(temp,"office");
  const pluginRoot=path.join(officeRoot,"plugins","smoke");
  const projectPath=path.join(temp,"project");
  fs.mkdirSync(pluginRoot,{recursive:true});
  fs.mkdirSync(projectPath,{recursive:true});
  fs.writeFileSync(path.join(projectPath,"readme.txt"),"hello","utf8");

  fs.writeFileSync(path.join(pluginRoot,"plugin.json"),JSON.stringify({
    id:"smoke",name:"Smoke Plugin",version:"1.0.0",apiVersion:"2.0",entry:"index.mjs",enabledByDefault:true,
    permissions:["read_project","tool"],hooks:["tool.invoke"],
    contributes:{tools:[{id:"smoke.echo",label:"Smoke Echo",description:"Echo"}]}
  }),"utf8");
  fs.writeFileSync(path.join(pluginRoot,"index.mjs"),`export const hooks={"tool.invoke":async(ctx,api)=>({text:api.readText("readme.txt"),payload:ctx.payload})};`,"utf8");

  const registry=new PluginRegistryV2();
  const manifests=registry.discover(officeRoot);
  if(manifests.length!==1)throw new Error("plugin discovery failed");
  const states=registry.states(projectPath,manifests);
  if(!states[0].enabled)throw new Error("default plugin state failed");

  const runtime=new PluginRuntimeV2(officeRoot);
  const result=await runtime.invoke(manifests[0],states[0],{projectId:"p1",projectPath,actor:"qa",hook:"tool.invoke",payload:{message:"hi"}});
  if(!result.ok||(result.data as any)?.text!=="hello")throw new Error("plugin runtime failed");

  const contributions=resolvePluginContributions(manifests,states);
  if(contributions.tools.length!==1)throw new Error("contribution resolver failed");

  console.log("Plugin SDK v2 smoke PASS");
}
main().catch(e=>{console.error(e);process.exit(1);});
