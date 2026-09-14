import fs from "node:fs";
import path from "node:path";
import {atomicWriteJson} from "../recovery/atomic-write";

export type Lease={
  id:string;
  taskId:string;
  agentId:string;
  files:string[];
  note:string;
  createdAt:string;
  expiresAt:string;
};

export type LeaseClaim={
  taskId:string;
  agentId:string;
  files?:string[];
  note?:string;
  ttlMs?:number;
};

export const DEFAULT_LEASE_TTL=30*60*1000;

function fileOf(projectPath:string){
  return path.join(projectPath,".ai-kit","coordination","leases.json");
}

function load(projectPath:string):Lease[]{
  try{
    const parsed=JSON.parse(fs.readFileSync(fileOf(projectPath),"utf8"));
    return Array.isArray(parsed)?parsed:[];
  }catch{
    return [];
  }
}

function save(projectPath:string, rows:Lease[]){
  atomicWriteJson(fileOf(projectPath), rows.slice(-400));
}

export function normalizeLeasePath(file:string){
  return String(file||"").replace(/\\/g,"/").replace(/^\.?\//,"").replace(/\/+$/,"").toLowerCase();
}

export function pathsOverlap(a:string,b:string){
  const left=normalizeLeasePath(a);
  const right=normalizeLeasePath(b);
  if(!left||!right)return false;
  if(left.startsWith("task:")||right.startsWith("task:"))return left===right;
  return left===right||left.startsWith(`${right}/`)||right.startsWith(`${left}/`);
}

export function leaseTargets(taskId:string, files:string[]=[]){
  return [...new Set([`task:${taskId}`,...files.map(x=>x.replace(/\\/g,"/")).filter(Boolean)])];
}

export function expireLeases(projectPath:string, now=Date.now()){
  const live=load(projectPath).filter(row=>Date.parse(row.expiresAt)>now);
  save(projectPath, live);
  return live;
}

export function listLeases(projectPath:string){
  return expireLeases(projectPath);
}

export function leaseConflicts(projectPath:string, agentId:string, files:string[], taskId?:string){
  return listLeases(projectPath).filter(row=>{
    if(row.agentId===agentId&&row.taskId===(taskId||row.taskId))return false;
    return row.files.some(held=>files.some(file=>pathsOverlap(held,file)));
  });
}

export function claimLease(projectPath:string, input:LeaseClaim){
  const files=leaseTargets(input.taskId, input.files||[]);
  const conflicts=leaseConflicts(projectPath, input.agentId, files, input.taskId);
  if(conflicts.length){
    return {ok:false as const, lease:null, conflicts};
  }
  const now=Date.now();
  const ttl=Math.max(60_000, input.ttlMs||DEFAULT_LEASE_TTL);
  const existing=expireLeases(projectPath, now).filter(row=>!(row.agentId===input.agentId&&row.taskId===input.taskId));
  const lease:Lease={
    id:`${input.agentId}:${input.taskId}`,
    taskId:input.taskId,
    agentId:input.agentId,
    files,
    note:input.note||"",
    createdAt:new Date(now).toISOString(),
    expiresAt:new Date(now+ttl).toISOString()
  };
  save(projectPath, [...existing, lease]);
  return {ok:true as const, lease, conflicts:[] as Lease[]};
}

export function renewLease(projectPath:string, agentId:string, taskId:string, ttlMs=DEFAULT_LEASE_TTL){
  const rows=listLeases(projectPath);
  const row=rows.find(x=>x.agentId===agentId&&x.taskId===taskId);
  if(!row)return null;
  row.expiresAt=new Date(Date.now()+Math.max(60_000,ttlMs)).toISOString();
  save(projectPath, rows);
  return row;
}

export function releaseLease(projectPath:string, agentId:string, taskId?:string){
  const next=listLeases(projectPath).filter(row=>{
    if(row.agentId!==agentId)return true;
    if(taskId&&row.taskId!==taskId)return true;
    return false;
  });
  save(projectPath, next);
  return next;
}

export function sweepOrphanLeases(projectPath:string, liveTaskIds:string[]){
  const live=new Set(liveTaskIds.filter(Boolean));
  const next=listLeases(projectPath).filter(row=>live.has(row.taskId));
  save(projectPath, next);
  return next;
}
