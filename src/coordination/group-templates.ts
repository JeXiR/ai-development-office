import fs from "node:fs";
import path from "node:path";
import {atomicWriteJson} from "../recovery/atomic-write";

export type GroupTemplate={
  id:string;
  name:string;
  leadRole:string;
  collaboratorRoles:string[];
  collaboratorCodingRoles:string[];
  executionMode:"solo"|"collaborative"|"competitive";
  builtin?:boolean;
};

export const BUILTIN_GROUP_TEMPLATES:GroupTemplate[]=[
  {id:"verify-pair",name:"Lead + QA",leadRole:"Backend",collaboratorRoles:["QA"],collaboratorCodingRoles:[],executionMode:"collaborative",builtin:true},
  {id:"frontend-ship",name:"Frontend ship",leadRole:"Frontend",collaboratorRoles:["QA"],collaboratorCodingRoles:[],executionMode:"collaborative",builtin:true},
  {id:"security-sprint",name:"Security sprint",leadRole:"Security",collaboratorRoles:["QA","Backend"],collaboratorCodingRoles:[],executionMode:"collaborative",builtin:true},
  {id:"compete",name:"Cursor vs Claude",leadRole:"Backend",collaboratorRoles:["QA"],collaboratorCodingRoles:[],executionMode:"competitive",builtin:true}
];

function fileOf(projectPath:string){
  return path.join(projectPath,".ai-kit","coordination","group-templates.json");
}

function loadCustom(projectPath:string):GroupTemplate[]{
  try{
    const parsed=JSON.parse(fs.readFileSync(fileOf(projectPath),"utf8"));
    return (Array.isArray(parsed)?parsed:[]).filter(row=>row&&row.id&&!BUILTIN_GROUP_TEMPLATES.some(b=>b.id===row.id));
  }catch{
    return [];
  }
}

export function listGroupTemplates(projectPath:string){
  return [...BUILTIN_GROUP_TEMPLATES,...loadCustom(projectPath)];
}

export function resolveGroupTemplate(projectPath:string, id?:string|null){
  if(!id)return null;
  return listGroupTemplates(projectPath).find(row=>row.id===id)||null;
}

export function saveGroupTemplate(projectPath:string, template:GroupTemplate){
  const id=String(template.id||"").trim();
  if(!id||BUILTIN_GROUP_TEMPLATES.some(row=>row.id===id))return {ok:false as const, error:"Cannot overwrite a built-in template."};
  const next=loadCustom(projectPath).filter(row=>row.id!==id);
  next.push({
    id,
    name:String(template.name||id),
    leadRole:String(template.leadRole||"Backend"),
    collaboratorRoles:(template.collaboratorRoles||[]).map(String).filter(Boolean),
    collaboratorCodingRoles:(template.collaboratorCodingRoles||[]).map(String).filter(Boolean),
    executionMode:["solo","collaborative","competitive"].includes(template.executionMode)?template.executionMode:"collaborative"
  });
  atomicWriteJson(fileOf(projectPath), next);
  return {ok:true as const, template:next[next.length-1]};
}

export function applyGroupTemplate<T extends{
  assignedRole?:string|null;
  leadRole?:string|null;
  collaboratorRoles?:string[];
  collaboratorCodingRoles?:string[];
  executionMode?:string;
}>(template:GroupTemplate|null, item:T):T&{groupTemplateId?:string}{
  if(!template)return item;
  const lead=String(item.assignedRole||item.leadRole||template.leadRole);
  return {
    ...item,
    assignedRole:item.assignedRole||lead,
    leadRole:lead,
    collaboratorRoles:template.collaboratorRoles.filter(role=>role!==lead),
    collaboratorCodingRoles:template.collaboratorCodingRoles,
    executionMode:template.executionMode,
    groupTemplateId:template.id
  };
}
