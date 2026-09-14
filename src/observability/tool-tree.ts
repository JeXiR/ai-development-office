import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type ToolKind="task"|"subagent"|"tool"|"consult"|"lease"|"verify"|"hive"|"merge";
export type ToolStatus="running"|"ok"|"failed";

export type ToolEvent={
  id:string;
  parentId:string|null;
  itemId:string;
  agentId:string;
  kind:ToolKind;
  name:string;
  status:ToolStatus;
  detail:string;
  at:string;
};

export type ToolNode=ToolEvent&{children:ToolNode[]};

function fileOf(projectPath:string){
  return path.join(projectPath,".ai-kit","observability","tools.jsonl");
}

export function appendToolEvent(projectPath:string, input:Omit<ToolEvent,"id"|"at"|"detail"|"parentId"|"status">&Partial<Pick<ToolEvent,"id"|"at"|"detail"|"parentId"|"status">>){
  const row:ToolEvent={
    id:input.id||crypto.randomUUID(),
    parentId:input.parentId||null,
    itemId:input.itemId,
    agentId:input.agentId,
    kind:input.kind,
    name:input.name,
    status:input.status||"running",
    detail:String(input.detail||"").slice(0,400),
    at:input.at||new Date().toISOString()
  };
  const file=fileOf(projectPath);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.appendFileSync(file,JSON.stringify(row)+"\n","utf8");
  return row;
}

export function listToolEvents(projectPath:string, limit=200):ToolEvent[]{
  const file=fileOf(projectPath);
  if(!fs.existsSync(file))return [];
  const rows=fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(line=>{
    try{return JSON.parse(line) as ToolEvent;}catch{return null;}
  }).filter((x):x is ToolEvent=>!!x);
  return rows.slice(-Math.max(1,limit));
}

export function buildToolTree(events:ToolEvent[]):ToolNode[]{
  const byId=new Map<string,ToolNode>();
  for(const event of events)byId.set(event.id,{...event,children:[]});
  const roots:ToolNode[]=[];
  for(const node of byId.values()){
    if(node.parentId&&byId.has(node.parentId))byId.get(node.parentId)!.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export function toolTreeSnapshot(projectPath:string, limit=120){
  const events=listToolEvents(projectPath,limit);
  return {events, tree:buildToolTree(events)};
}
