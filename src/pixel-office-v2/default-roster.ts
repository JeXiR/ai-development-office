import type {OfficeAgent} from "@/types/office";
import {roleToStation} from "./runtime-map";

export type FloorRosterAgent={
  id:string;
  role:string;
  provider:"auto";
  state:"idle";
  station:ReturnType<typeof roleToStation>;
  targetStation:null;
  speech:null;
  taskLabel:null;
  progress:null;
  lastEventAt:string;
};

const ROLES:Array<{id:string;role:string}> = [
  {id:"ceo",role:"CEO"},
  {id:"cto",role:"CTO"},
  {id:"pm",role:"PM"},
  {id:"architect",role:"Architect"},
  {id:"docs",role:"Docs"},
  {id:"devops",role:"DevOps"},
  {id:"qa",role:"QA"},
  {id:"security",role:"Security"},
  {id:"frontend",role:"Frontend"},
  {id:"backend",role:"Backend"},
  {id:"git",role:"Git"},
  {id:"database",role:"Database"}
];

export function defaultFloorRoster():FloorRosterAgent[]{
  const stamp=new Date(0).toISOString();
  return ROLES.map(row=>({
    id:row.id,
    role:row.role,
    provider:"auto",
    state:"idle",
    station:roleToStation(row.role),
    targetStation:null,
    speech:null,
    taskLabel:null,
    progress:null,
    lastEventAt:stamp
  }));
}

export function rosterKeyOf(id:string,role?:string){
  const raw=String(role||id||"").toLowerCase();
  if(/ceo|director|chief executive/.test(raw)&&!/cto/.test(raw))return "ceo";
  if(/\bcto\b|chief technology/.test(raw))return "cto";
  if(/\bpm\b|product manager|project manager/.test(raw))return "pm";
  if(/architect/.test(raw))return "architect";
  if(/docs|documentation|writer/.test(raw))return "docs";
  if(/devops|sre|infra/.test(raw))return "devops";
  if(/\bqa\b|quality|test/.test(raw)&&!/architect/.test(raw))return "qa";
  if(/security|auth/.test(raw))return "security";
  if(/frontend|react|next|ui/.test(raw)&&!/flutter/.test(raw))return "frontend";
  if(/backend|laravel|api|worker/.test(raw))return "backend";
  if(/\bgit\b|review|merge/.test(raw))return "git";
  if(/database|mysql|postgres|sql/.test(raw))return "database";
  return String(id||role||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
}

const CORE=new Set(["CEO","CTO","PM","Architect","Docs","DevOps","QA","Security"]);

export function defaultOfficeAgents():OfficeAgent[]{
  return ROLES.map(row=>({
    id:row.id,
    role:row.role,
    status:"idle",
    task:null,
    displayName:row.role,
    kind:CORE.has(row.role)?"core":"specialist",
    scope:"active",
    progressPercent:null
  }));
}

export function mergeOfficeRoster(agents:OfficeAgent[]|undefined|null):OfficeAgent[]{
  const merged=defaultOfficeAgents();
  for(const agent of agents||[]){
    const key=rosterKeyOf(agent.id,String(agent.role||agent.displayName||agent.id));
    if(!key)continue;
    const idx=merged.findIndex(a=>rosterKeyOf(a.id,String(a.role))===key);
    if(idx>=0)merged[idx]={...merged[idx],...agent,id:agent.id||merged[idx].id,role:agent.role||merged[idx].role};
    else merged.push(agent);
  }
  return merged;
}
