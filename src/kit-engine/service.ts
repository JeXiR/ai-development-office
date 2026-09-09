import fs from "node:fs";
import path from "node:path";
import {locateKit} from "./locator";
import {loadKitCapabilities,loadKitCommands,loadKitCompositions,loadKitSkills,loadKitWorkflows} from "./parser";
import {discoverProjectStack} from "./project-discovery";
import {resolveProjectCapabilities} from "./capability-resolver";
import type {EmbeddedKitEngine,KitSnapshot} from "./types";

function detectVersion(root:string){
  for(const rel of ["package.json","kit.manifest.json","manifest.json","VERSION"]){
    const file=path.join(root,rel);
    if(!fs.existsSync(file))continue;
    try{
      if(rel==="VERSION")return fs.readFileSync(file,"utf8").trim()||null;
      const parsed=JSON.parse(fs.readFileSync(file,"utf8"));
      if(parsed.version)return String(parsed.version);
    }catch{}
  }
  return null;
}

export class EmbeddedKitEngineService implements EmbeddedKitEngine{
  constructor(private readonly officeRoot:string){}

  async detect():Promise<KitSnapshot>{
    const location=locateKit(this.officeRoot);
    const root=location.root;
    if(!root){
      return {installed:false,root:null,locationMode:"missing",version:null,skills:[],commands:[],workflows:[],capabilities:[],compositions:[],warnings:["Embedded AI Development Kit is missing from engine/ai-development-kit."]};
    }

    const warnings:string[]=[];
    const skills=loadKitSkills(root);
    const commands=loadKitCommands(root);
    const workflows=loadKitWorkflows(root);
    const capabilities=loadKitCapabilities(root);
    const compositions=loadKitCompositions(root);

    if(!skills.length)warnings.push("No Kit skills discovered.");
    if(!commands.length)warnings.push("No Kit commands discovered.");
    if(!workflows.length)warnings.push("No Kit workflows discovered.");
    if(!capabilities.length)warnings.push("No Kit capabilities discovered.");

    return {
      installed:true,
      root,
      locationMode:location.mode,
      version:detectVersion(root),
      skills,
      commands,
      workflows,
      capabilities,
      compositions,
      warnings
    };
  }

  async discoverProject(projectPath:string){
    return discoverProjectStack(projectPath) as unknown as Record<string,unknown>;
  }

  async resolveCapabilities(projectPath:string){
    const snapshot=await this.detect();
    if(!snapshot.installed)return [];
    const discovery=discoverProjectStack(projectPath);
    return resolveProjectCapabilities(discovery,snapshot.capabilities);
  }

  async syncProject(projectPath:string){
    const aiKitDir=path.join(projectPath,".ai-kit");
    fs.mkdirSync(aiKitDir,{recursive:true});
    const discovery=discoverProjectStack(projectPath);
    const resolved=await this.resolveCapabilities(projectPath);
    const payload={
      generatedBy:"AI Development Office Embedded Kit Engine",
      generatedAt:new Date().toISOString(),
      project:discovery,
      resolvedCapabilities:resolved
    };
    fs.writeFileSync(path.join(aiKitDir,"office-kit-state.json"),JSON.stringify(payload,null,2)+"\n","utf8");
  }

  async validate(){
    const snapshot=await this.detect();
    const warnings=[...snapshot.warnings];
    if(snapshot.installed&&!snapshot.version)warnings.push("Kit version could not be detected.");
    return {
      ok:snapshot.installed&&snapshot.capabilities.length>0,
      warnings
    };
  }
}
