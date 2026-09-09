import path from "node:path";
import {readJsonSafe,readTextSafe,slugFromPath,titleFromPath,walkFiles} from "./fs-utils";
import type {KitCapability,KitCommand,KitSkill,KitWorkflow} from "./types";

function firstHeading(text:string|null){
  if(!text)return null;
  const m=text.match(/^#\s+(.+)$/m);
  return m?.[1]?.trim()||null;
}

function relativeId(root:string,file:string,marker:string){
  const rel=path.relative(path.join(root,marker),file).replace(/\\/g,"/");
  return rel.replace(/\/(?:SKILL|WORKFLOW)\.md$/i,"").replace(/\.(md|mdx|json|ya?ml)$/i,"").toLowerCase();
}

function parseCapabilityIds(text:string|null){
  if(!text)return [];
  const ids=new Set<string>();
  for(const m of text.matchAll(/\bcapabilit(?:y|ies)\s*:\s*([^\n]+)/gi)){
    for(const raw of m[1].split(/[,\s]+/)){
      const id=raw.trim().replace(/[()[\]`"'*]/g,"");
      if(id)ids.add(id);
    }
  }
  return [...ids];
}

export function loadKitSkills(root:string):KitSkill[]{
  const sources=[
    ["shared/skills",path.join(root,"shared","skills")],
    ["skills",path.join(root,"skills")],
    ["docs/skills",path.join(root,"docs","skills")]
  ] as const;

  const rows:KitSkill[]=[];
  const seen=new Set<string>();

  for(const [marker,dir] of sources){
    for(const file of walkFiles(dir,f=>/(?:SKILL\.md|\.mdx?)$/i.test(f))){
      const text=readTextSafe(file);
      const id=marker==="shared/skills"?relativeId(root,file,marker):slugFromPath(file);
      if(seen.has(id))continue;
      seen.add(id);
      rows.push({id,title:firstHeading(text)||titleFromPath(path.dirname(file)),path:file,capabilityIds:parseCapabilityIds(text)});
    }
  }
  return rows;
}

export function loadKitCommands(root:string):KitCommand[]{
  const dirs=[
    path.join(root,"adapters","claude","commands"),
    path.join(root,"commands"),
    path.join(root,"docs","commands")
  ];
  const rows:KitCommand[]=[];
  const seen=new Set<string>();
  for(const dir of dirs){
    for(const file of walkFiles(dir,f=>/\.(md|mdx|json)$/i.test(f))){
      const id=slugFromPath(file);
      if(seen.has(id))continue;
      seen.add(id);
      const text=/\.json$/i.test(file)?null:readTextSafe(file);
      rows.push({id,title:firstHeading(text)||titleFromPath(file),path:file});
    }
  }
  return rows;
}

export function loadKitWorkflows(root:string):KitWorkflow[]{
  const dirs=[
    ["shared/workflows",path.join(root,"shared","workflows")],
    ["workflows",path.join(root,"workflows")],
    ["docs/workflows",path.join(root,"docs","workflows")]
  ] as const;

  const rows:KitWorkflow[]=[];
  const seen=new Set<string>();
  for(const [marker,dir] of dirs){
    for(const file of walkFiles(dir,f=>/(?:WORKFLOW\.md|\.mdx?|\.json|\.ya?ml)$/i.test(f))){
      const id=marker==="shared/workflows"?relativeId(root,file,marker):slugFromPath(file);
      if(seen.has(id))continue;
      seen.add(id);
      const text=/\.(md|mdx)$/i.test(file)?readTextSafe(file):null;
      rows.push({id,title:firstHeading(text)||titleFromPath(path.dirname(file)),path:file});
    }
  }
  return rows;
}

export function loadKitCapabilities(root:string):KitCapability[]{
  const catalogFiles=[
    path.join(root,"shared","capabilities","catalog.json"),
    path.join(root,"shared","capabilities","registry.json"),
    path.join(root,"capabilities.json"),
    path.join(root,"registry","capabilities.json")
  ];

  for(const file of catalogFiles){
    const parsed=readJsonSafe<any>(file);
    const list=Array.isArray(parsed)?parsed:Array.isArray(parsed?.capabilities)?parsed.capabilities:null;
    if(!list)continue;

    return list.map((c:any)=>{
      const id=String(c.id||c.slug||c.name||"").trim();
      let title=String(c.title||c.name||id);
      let category=String(c.category||id.split(".")[0]||"general");
      let tags:Array<string>=Array.isArray(c.tags)?c.tags.map(String):Array.isArray(c.aliases)?c.aliases.map(String):[];

      if(c.manifest){
        const manifestPath=path.join(root,String(c.manifest));
        const manifest=readJsonSafe<any>(manifestPath);
        title=String(manifest?.name||manifest?.title||title);
        category=String(manifest?.category||category);
        tags=[...new Set([...tags,...(Array.isArray(manifest?.aliases)?manifest.aliases.map(String):[])])];
      }

      return {id,title,category,tags,source:file};
    }).filter((c:KitCapability)=>Boolean(c.id));
  }

  return [];
}

export function loadKitCompositions(root:string):string[]{
  const candidates=[
    path.join(root,"shared","compositions","registry.json"),
    path.join(root,"compositions.json"),
    path.join(root,"registry","compositions.json")
  ];
  for(const file of candidates){
    const parsed=readJsonSafe<any>(file);
    const list=Array.isArray(parsed)?parsed:Array.isArray(parsed?.compositions)?parsed.compositions:null;
    if(list)return list.map((x:any)=>String(x.id||x.name||x)).filter(Boolean);
  }
  return [];
}
