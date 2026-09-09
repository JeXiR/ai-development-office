import type {OfficeProject,RunnerProvider} from "@/types/office";

export const ACTIVE_PROJECT_KEY="office-active-project";
export const PROJECTS_CACHE_KEY="office-projects-cache";

export type ProjectCacheStorage={
  getItem(key:string):string|null;
  setItem(key:string,value:string):void;
};

type CachedProject={
  id:string;
  name:string;
  path:string;
  enabled:boolean;
  provider?:RunnerProvider;
  runnerTrusted?:boolean;
};

function isProvider(value:unknown):value is RunnerProvider{
  return value==="auto"||value==="cursor"||value==="claude";
}

function slimProject(project:OfficeProject):CachedProject|null{
  const id=String(project?.id||"").trim();
  const name=String(project?.name||"").trim();
  const path=String(project?.path||"").trim();
  if(!id||!name||!path||project.enabled===false)return null;
  const row:CachedProject={id,name,path,enabled:project.enabled!==false};
  if(isProvider(project.provider))row.provider=project.provider;
  if(typeof project.runnerTrusted==="boolean")row.runnerTrusted=project.runnerTrusted;
  return row;
}

export function pickActiveProjectId(projects:OfficeProject[],preferred:string|null|undefined){
  const enabled=projects.filter(project=>project.enabled);
  if(preferred&&enabled.some(project=>project.id===preferred))return preferred;
  return enabled[0]?.id??null;
}

export function readProjectsCache(storage?:ProjectCacheStorage|null){
  const store=storage??(typeof window==="undefined"?null:window.localStorage);
  if(!store)return {projects:[] as OfficeProject[],activeProjectId:null as string|null};
  const savedId=String(store.getItem(ACTIVE_PROJECT_KEY)||"").trim()||null;
  try{
    const raw=store.getItem(PROJECTS_CACHE_KEY);
    if(!raw)return {projects:[] as OfficeProject[],activeProjectId:savedId};
    const parsed=JSON.parse(raw);
    const rows=Array.isArray(parsed?.projects)?parsed.projects:[];
    const projects=rows.map((row:unknown)=>slimProject(row as OfficeProject)).filter(Boolean) as OfficeProject[];
    const cachedId=typeof parsed?.activeProjectId==="string"?parsed.activeProjectId:null;
    return {
      projects,
      activeProjectId:pickActiveProjectId(projects,savedId||cachedId)
    };
  }catch{
    return {projects:[] as OfficeProject[],activeProjectId:savedId};
  }
}

export function writeProjectsCache(projects:OfficeProject[],activeProjectId:string|null,storage?:ProjectCacheStorage|null){
  const store=storage??(typeof window==="undefined"?null:window.localStorage);
  if(!store)return;
  const slim=projects.map(slimProject).filter(Boolean) as CachedProject[];
  const nextId=pickActiveProjectId(slim,activeProjectId);
  if(nextId)store.setItem(ACTIVE_PROJECT_KEY,nextId);
  store.setItem(PROJECTS_CACHE_KEY,JSON.stringify({projects:slim,activeProjectId:nextId}));
}
