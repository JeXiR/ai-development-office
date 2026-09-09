import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type IntegrityRow={path:string;bytes:number;sha256:string};
export type IntegrityManifest={
  version:1;
  createdAt:string;
  rootVersion:string;
  files:IntegrityRow[];
};

const EXCLUDED_DIRS=new Set(["node_modules",".next",".git","dist","coverage","updates",".turbo"]);
const EXCLUDED_FILES=new Set(["release-integrity.json",".env",".env.local"]);
const EXCLUDED_SUFFIXES=[".log",".tsbuildinfo"];

export function isIntegrityExcluded(relPath:string){
  const normalized=relPath.replace(/\\/g,"/").replace(/^\.\//,"");
  const parts=normalized.split("/");
  if(parts.some(part=>EXCLUDED_DIRS.has(part)))return true;
  const name=parts[parts.length-1]||"";
  if(EXCLUDED_FILES.has(name))return true;
  if(name.startsWith(".env."))return true;
  return EXCLUDED_SUFFIXES.some(suffix=>name.endsWith(suffix));
}

function sha(file:string){
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function walk(root:string,current=root,out:string[]=[]){
  for(const e of fs.readdirSync(current,{withFileTypes:true})){
    if(EXCLUDED_DIRS.has(e.name))continue;
    const p=path.join(current,e.name);
    const rel=path.relative(root,p).replace(/\\/g,"/");
    if(e.isDirectory())walk(root,p,out);
    else if(!isIntegrityExcluded(rel))out.push(p);
  }
  return out;
}

export function createIntegrityManifest(root:string,rootVersion:string):IntegrityManifest{
  const files=walk(root).sort().map(file=>({
    path:path.relative(root,file).replace(/\\/g,"/"),
    bytes:fs.statSync(file).size,
    sha256:sha(file)
  }));
  return {version:1,createdAt:new Date().toISOString(),rootVersion,files};
}

export function writeIntegrityManifest(root:string,rootVersion:string){
  const manifest=createIntegrityManifest(root,rootVersion);
  const file=path.join(root,"release-integrity.json");
  fs.writeFileSync(file,JSON.stringify(manifest,null,2)+"\n","utf8");
  return {file,manifest};
}

export function verifyIntegrityManifest(root:string){
  const file=path.join(root,"release-integrity.json");
  if(!fs.existsSync(file))return {ok:false,issues:["release-integrity.json missing"]};

  const manifest:IntegrityManifest=JSON.parse(fs.readFileSync(file,"utf8"));
  const issues:string[]=[];
  const listed=new Set<string>();

  for(const row of manifest.files){
    if(isIntegrityExcluded(row.path))continue;
    listed.add(row.path.replace(/\\/g,"/"));
    const p=path.join(root,row.path);
    if(!fs.existsSync(p)){issues.push(`missing: ${row.path}`);continue;}
    const stat=fs.statSync(p);
    if(stat.size!==row.bytes)issues.push(`size mismatch: ${row.path}`);
    if(sha(p)!==row.sha256)issues.push(`checksum mismatch: ${row.path}`);
  }

  for(const filePath of walk(root)){
    const rel=path.relative(root,filePath).replace(/\\/g,"/");
    if(!listed.has(rel))issues.push(`unexpected: ${rel}`);
  }

  return {ok:issues.length===0,issues,manifest};
}
