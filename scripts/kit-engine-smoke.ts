import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {EmbeddedKitEngineService} from "../src/kit-engine/service";

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"ado-kit-smoke-"));
const office=path.join(tmp,"office");
const kit=path.join(office,"engine","ai-development-kit");
const project=path.join(tmp,"project");

fs.mkdirSync(path.join(kit,"skills"),{recursive:true});
fs.mkdirSync(path.join(kit,"commands"),{recursive:true});
fs.mkdirSync(path.join(kit,"workflows"),{recursive:true});
fs.mkdirSync(path.join(kit,"capabilities"),{recursive:true});
fs.mkdirSync(project,{recursive:true});

fs.writeFileSync(path.join(kit,"package.json"),JSON.stringify({version:"9.9.9"}));
fs.writeFileSync(path.join(kit,"skills","laravel-security.md"),"# Laravel Security\nCapability: laravel security testing\n");
fs.writeFileSync(path.join(kit,"commands","status.md"),"# Status\n");
fs.writeFileSync(path.join(kit,"workflows","review.md"),"# Review\n");
fs.writeFileSync(path.join(kit,"capabilities.json"),JSON.stringify({capabilities:[
  {id:"backend.laravel",title:"Laravel Backend",category:"backend",tags:["laravel","php"]},
  {id:"security",title:"Security",category:"quality",tags:["security"]},
  {id:"testing",title:"Testing",category:"quality",tags:["testing"]}
]}));
fs.writeFileSync(path.join(project,"composer.json"),JSON.stringify({require:{"laravel/framework":"^13.0"}}));
fs.writeFileSync(path.join(project,"package.json"),JSON.stringify({dependencies:{react:"19.0.0"}}));

const engine=new EmbeddedKitEngineService(office);
const snapshot=await engine.detect();
if(!snapshot.installed)throw new Error("Kit was not detected");
if(snapshot.version!=="9.9.9")throw new Error("Kit version detection failed");
if(snapshot.skills.length!==1)throw new Error("Skill discovery failed");
if(snapshot.commands.length!==1)throw new Error("Command discovery failed");
if(snapshot.workflows.length!==1)throw new Error("Workflow discovery failed");
if(snapshot.capabilities.length!==3)throw new Error("Capability discovery failed");

const discovery=await engine.discoverProject(project) as any;
if(!discovery.frameworks.includes("laravel"))throw new Error("Laravel discovery failed");
if(!discovery.frameworks.includes("react"))throw new Error("React discovery failed");

const resolved=await engine.resolveCapabilities(project);
if(!resolved.includes("backend.laravel"))throw new Error("Laravel capability resolution failed");
if(!resolved.includes("security"))throw new Error("Security capability resolution failed");

await engine.syncProject(project);
if(!fs.existsSync(path.join(project,".ai-kit","office-kit-state.json")))throw new Error("Project sync failed");

const validation=await engine.validate();
if(!validation.ok)throw new Error("Kit validation failed");

fs.rmSync(tmp,{recursive:true,force:true});
console.log("Kit Engine smoke PASS");
