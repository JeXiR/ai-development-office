import fs from "node:fs";
import path from "node:path";

export function walkFiles(dir:string,predicate?:(file:string)=>boolean):string[]{
  if(!fs.existsSync(dir))return [];
  const out:string[]=[];
  const stack=[dir];
  while(stack.length){
    const current=stack.pop()!;
    for(const entry of fs.readdirSync(current,{withFileTypes:true})){
      const p=path.join(current,entry.name);
      if(entry.isDirectory())stack.push(p);
      else if(!predicate||predicate(p))out.push(p);
    }
  }
  return out;
}

export function readJsonSafe<T=any>(file:string):T|null{
  try{return JSON.parse(fs.readFileSync(file,"utf8")) as T;}catch{return null;}
}

export function readTextSafe(file:string):string|null{
  try{return fs.readFileSync(file,"utf8");}catch{return null;}
}

export function slugFromPath(file:string){
  return path.basename(file,path.extname(file)).replace(/[^a-zA-Z0-9._-]+/g,"-").toLowerCase();
}

export function titleFromPath(file:string){
  return path.basename(file,path.extname(file))
    .replace(/[-_]+/g," ")
    .replace(/\b\w/g,c=>c.toUpperCase());
}
