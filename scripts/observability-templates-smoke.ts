import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {appendToolEvent,buildToolTree,toolTreeSnapshot} from "../src/observability/tool-tree";
import {applyGroupTemplate,listGroupTemplates,resolveGroupTemplate,saveGroupTemplate} from "../src/coordination/group-templates";
import {codesignConfigured,codesignStatus,signDesktopBundle} from "../desktop/codesign";
import {lintPalace,loadMemoryGraph,saveMemoryGraph,upsertNode} from "../src/memory-v2/graph";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-obs-"));

const task=appendToolEvent(temp,{itemId:"PROG-1",agentId:"frontend",kind:"task",name:"Auth form",status:"running"});
const child=appendToolEvent(temp,{parentId:task.id,itemId:"PROG-1",agentId:"qa",kind:"verify",name:"independent verify",status:"ok",detail:"VERDICT: PASS"});
const tree=buildToolTree(toolTreeSnapshot(temp).events);
if(tree.length!==1||tree[0].children[0]?.id!==child.id)throw new Error("tool tree nesting failed");

const templates=listGroupTemplates(temp);
if(templates.length<4)throw new Error("builtin templates missing");
const applied=applyGroupTemplate(resolveGroupTemplate(temp,"verify-pair"),{assignedRole:"Frontend",executionMode:"solo"});
if(applied.leadRole!=="Frontend"||!applied.collaboratorRoles.includes("QA")||applied.executionMode!=="collaborative"){
  throw new Error("verify-pair did not keep lead and add QA");
}
const custom=saveGroupTemplate(temp,{id:"docs-pair",name:"Docs pair",leadRole:"CEO",collaboratorRoles:["QA"],collaboratorCodingRoles:[],executionMode:"solo"});
if(!custom.ok)throw new Error(custom.error);
if(saveGroupTemplate(temp,{id:"verify-pair",name:"nope",leadRole:"QA",collaboratorRoles:[],collaboratorCodingRoles:[],executionMode:"solo"}).ok){
  throw new Error("builtin overwrite must fail");
}

const status=codesignStatus();
if(!codesignConfigured()&&(status.signed||status.configured))throw new Error("unsigned status expected without a cert");
const signed=signDesktopBundle(temp);
if(!codesignConfigured()&&signed.signed)throw new Error("sign must not fake a signature");

const graph=loadMemoryGraph(temp);
for(let i=0;i<6;i++){
  upsertNode(graph,{id:`decision:${i}`,kind:"decision",label:`D${i}`,room:"decisions",refs:[]});
}
if(lintPalace(graph).ok)throw new Error("six decisions should fail lint");
saveMemoryGraph(temp,graph);
const saved=loadMemoryGraph(temp);
if(saved.nodes.filter(x=>x.kind==="decision").length!==5)throw new Error("palace did not prune to 5 decisions");

console.log("Observability / templates / codesign / palace lint smoke PASS");
