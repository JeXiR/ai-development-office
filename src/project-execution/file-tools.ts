import fs from "node:fs";
import path from "node:path";
import {resolveProjectPath,isBlockedProjectPath} from "./path-guard";

export function readProjectFile(projectRoot:string,file:string,maxBytes=1024*1024){
  const target=resolveProjectPath(projectRoot,file);
  const stat=fs.statSync(target);
  if(!stat.isFile())throw new Error("Requested path is not a file.");
  if(stat.size>maxBytes)throw new Error(`File exceeds read limit (${maxBytes} bytes).`);
  return {path:file,content:fs.readFileSync(target,"utf8"),bytes:stat.size};
}

export function writeProjectFile(projectRoot:string,file:string,content:string){
  const target=resolveProjectPath(projectRoot,file,{allowMissing:true});
  if(isBlockedProjectPath(target))throw new Error("Sensitive file write blocked.");
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const existed=fs.existsSync(target);
  const previous=existed?fs.readFileSync(target,"utf8"):null;
  fs.writeFileSync(target,content,"utf8");
  return {path:file,created:!existed,previousBytes:previous?Buffer.byteLength(previous):0,newBytes:Buffer.byteLength(content)};
}

export function patchProjectFile(projectRoot:string,file:string,search:string,replace:string){
  const target=resolveProjectPath(projectRoot,file);
  if(isBlockedProjectPath(target))throw new Error("Sensitive file write blocked.");
  const content=fs.readFileSync(target,"utf8");
  if(!content.includes(search))throw new Error("Patch search text not found.");
  const next=content.replace(search,replace);
  fs.writeFileSync(target,next,"utf8");
  return {path:file,changed:true,beforeBytes:Buffer.byteLength(content),afterBytes:Buffer.byteLength(next)};
}

export function listProjectFiles(projectRoot:string,dir=".",limit=500){
  const target=resolveProjectPath(projectRoot,dir);
  const out:string[]=[];
  const stack=[target];
  const root=path.resolve(projectRoot);

  while(stack.length&&out.length<limit){
    const current=stack.pop()!;
    for(const entry of fs.readdirSync(current,{withFileTypes:true})){
      if(["node_modules",".git",".next","vendor","dist","build"].includes(entry.name))continue;
      const p=path.join(current,entry.name);
      if(entry.isDirectory())stack.push(p);
      else if(!isBlockedProjectPath(p))out.push(path.relative(root,p).replace(/\\/g,"/"));
      if(out.length>=limit)break;
    }
  }
  return out;
}
