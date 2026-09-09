import type {PixelAgentState,PixelStationId} from "./types";

export function runtimeStatusToPixelState(status:string):PixelAgentState{
  const s=status.toLowerCase();
  if(["running","working"].includes(s))return "working";
  if(["thinking","planning"].includes(s))return "thinking";
  if(["testing","qa"].includes(s))return "testing";
  if(["blocked","failed"].includes(s))return "blocked";
  if(["completed","done"].includes(s))return "done";
  return "idle";
}

export function roleToStation(role:string):PixelStationId{
  const r=role.toLowerCase();
  if(r.includes("qa")||r.includes("test"))return "qa";
  if(r.includes("security")||r.includes("auth"))return "security";
  if(r.includes("database")||r.includes("postgres")||r.includes("mysql")||r.includes("sql"))return "database";
  if(r.includes("devops")||r.includes("observability")||r.includes("sre")||r.includes("infra"))return "devops";
  if(r.includes("architect"))return "meeting";
  if(r.includes("director")||r.includes("ceo")||r.includes("cto")||r.includes("pm"))return "director";
  if(r.includes("git")||r.includes("review")||r.includes("merge"))return "git";
  if(r.includes("docs")||r.includes("memory")||r.includes("writer"))return "memory";
  if(r.includes("backend")||r.includes("worker")||r.includes("queue")||r.includes("api")||r.includes("laravel"))return "terminal";
  if(r.includes("frontend")||r.includes("flutter")||r.includes("ui")||r.includes("react")||r.includes("mobile"))return "editor";
  const desks:PixelStationId[]=["terminal","editor","git","qa","security","database","devops","memory"];
  let hash=0;
  for(let i=0;i<r.length;i++)hash=(hash*31+r.charCodeAt(i))>>>0;
  return desks[hash%desks.length];
}
