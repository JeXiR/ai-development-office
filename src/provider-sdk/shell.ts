import fs from "node:fs";
import path from "node:path";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
const execFileAsync=promisify(execFile);

export function commandCandidates(name:string){
  const ext=process.platform==="win32"?[".cmd",".exe",".bat",""]:[""];
  const pathDirs=(process.env.PATH||"").split(path.delimiter);
  const out:string[]=[];
  for(const dir of pathDirs){
    for(const e of ext){
      const p=path.join(dir,name+e);
      if(fs.existsSync(p))out.push(p);
    }
  }
  return [...new Set(out)];
}

export async function commandAvailable(name:string){
  return commandCandidates(name).length>0;
}

export async function commandVersion(name:string,args=["--version"]){
  const candidates=commandCandidates(name);
  for(const cmd of candidates){
    try{
      const {stdout,stderr}=await execFileAsync(cmd,args,{timeout:5000,windowsHide:true});
      return String(stdout||stderr||"").trim()||null;
    }catch{}
  }
  return null;
}
