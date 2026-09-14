import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {atomicWriteJson} from "../recovery/atomic-write";

export type PalaceRoom="architecture"|"decisions"|"handoffs"|"lessons"|"facts"|"working";
export type GraphNodeKind="agent"|"task"|"fact"|"decision"|"lesson"|"handoff"|"room";
export type GraphRelation="handoff"|"worked"|"recalls"|"depends"|"about";

export type MemoryGraphNode={
  id:string;
  kind:GraphNodeKind;
  label:string;
  room:PalaceRoom;
  refs:string[];
  updatedAt:string;
};

export type MemoryGraphEdge={
  id:string;
  from:string;
  to:string;
  rel:GraphRelation;
  title:string;
  createdAt:string;
};

export type MemoryGraph={
  nodes:MemoryGraphNode[];
  edges:MemoryGraphEdge[];
};

function now(){return new Date().toISOString();}
function fileOf(projectPath:string){return path.join(projectPath,".ai-kit","memory-v2","graph.json");}
function slug(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"node";}

function empty():MemoryGraph{return {nodes:[],edges:[]};}

export function loadMemoryGraph(projectPath:string):MemoryGraph{
  try{
    const parsed=JSON.parse(fs.readFileSync(fileOf(projectPath),"utf8"));
    return {
      nodes:Array.isArray(parsed?.nodes)?parsed.nodes:[],
      edges:Array.isArray(parsed?.edges)?parsed.edges:[]
    };
  }catch{
    return empty();
  }
}

export const MAX_PALACE_DECISIONS=5;

export function lintPalace(graph:MemoryGraph){
  const decisions=graph.nodes.filter(node=>node.kind==="decision").sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt));
  const extra=Math.max(0,decisions.length-MAX_PALACE_DECISIONS);
  return {
    ok:extra===0,
    decisionCount:decisions.length,
    pruneIds:extra?decisions.slice(0,extra).map(node=>node.id):[] as string[],
    warnings:extra?[`${decisions.length} decisions; keeping the newest ${MAX_PALACE_DECISIONS}.`]:[] as string[]
  };
}

export function prunePalace(graph:MemoryGraph){
  const lint=lintPalace(graph);
  if(!lint.pruneIds.length)return graph;
  const drop=new Set(lint.pruneIds);
  graph.nodes=graph.nodes.filter(node=>!drop.has(node.id));
  graph.edges=graph.edges.filter(edge=>!drop.has(edge.from)&&!drop.has(edge.to));
  return graph;
}

export function saveMemoryGraph(projectPath:string, graph:MemoryGraph){
  prunePalace(graph);
  atomicWriteJson(fileOf(projectPath), {
    nodes:graph.nodes.slice(-4000),
    edges:graph.edges.slice(-8000)
  });
}

export function upsertNode(graph:MemoryGraph, input:Omit<MemoryGraphNode,"updatedAt">){
  const existing=graph.nodes.find(x=>x.id===input.id);
  if(existing){
    existing.label=input.label;
    existing.kind=input.kind;
    existing.room=input.room;
    existing.refs=[...new Set([...existing.refs,...input.refs])];
    existing.updatedAt=now();
    return existing;
  }
  const row={...input,updatedAt:now()};
  graph.nodes.push(row);
  return row;
}

export function link(graph:MemoryGraph, from:string, to:string, rel:GraphRelation, title:string){
  const dup=graph.edges.find(x=>x.from===from&&x.to===to&&x.rel===rel&&x.title===title);
  if(dup)return dup;
  const row={id:crypto.randomUUID(),from,to,rel,title,createdAt:now()};
  graph.edges.push(row);
  return row;
}

export function rememberHandoff(projectPath:string, fromAgent:string, toAgent:string, taskId:string|null, title:string, body:string){
  const graph=loadMemoryGraph(projectPath);
  const fromId=`agent:${slug(fromAgent)}`;
  const toId=`agent:${slug(toAgent)}`;
  const task=taskId?`task:${slug(taskId)}`:null;
  upsertNode(graph,{id:fromId,kind:"agent",label:fromAgent,room:"working",refs:[]});
  upsertNode(graph,{id:toId,kind:"agent",label:toAgent,room:"handoffs",refs:[]});
  if(task)upsertNode(graph,{id:task,kind:"task",label:title,room:"working",refs:[fromId,toId]});
  const factId=`handoff:${slug(title).slice(0,40)}`;
  upsertNode(graph,{id:factId,kind:"handoff",label:title,room:"handoffs",refs:[fromId,toId,body.slice(0,240)]});
  link(graph,fromId,toId,"handoff",title);
  if(task){
    link(graph,fromId,task,"worked",title);
    link(graph,toId,task,"recalls",title);
  }
  saveMemoryGraph(projectPath,graph);
  return graph;
}

export function palaceContext(projectPath:string, agentIds:string[], limit=8){
  const graph=loadMemoryGraph(projectPath);
  const wanted=new Set(agentIds.map(x=>`agent:${slug(x)}`));
  const edges=graph.edges
    .filter(edge=>wanted.has(edge.from)||wanted.has(edge.to))
    .slice(-limit);
  if(!edges.length)return "";
  return edges.map(edge=>{
    const from=graph.nodes.find(x=>x.id===edge.from)?.label||edge.from;
    const to=graph.nodes.find(x=>x.id===edge.to)?.label||edge.to;
    return `${from} -[${edge.rel}]-> ${to}: ${edge.title}`;
  }).join("\n");
}

export function graphSnapshot(projectPath:string){
  const graph=loadMemoryGraph(projectPath);
  const rooms:Record<PalaceRoom,number>={architecture:0,decisions:0,handoffs:0,lessons:0,facts:0,working:0};
  for(const node of graph.nodes)rooms[node.room]=(rooms[node.room]||0)+1;
  return {...graph,rooms};
}
