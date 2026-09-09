import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type ProviderBootstrapRow={
  id:string;
  executable:string|null;
  source:"known-path"|"path"|"missing";
};

function exists(p:string){try{return fs.existsSync(p);}catch{return false;}}

function pathCandidates(command:string){
  const envPath=(process.env.PATH||"").split(path.delimiter).filter(Boolean);
  const exts=process.platform==="win32"?[".exe",".cmd",".bat",""]:[""];
  const rows:string[]=[];
  for(const dir of envPath)for(const ext of exts)rows.push(path.join(dir,command+ext));
  return rows;
}

function find(command:string,known:string[]=[]):ProviderBootstrapRow{
  for(const p of known)if(exists(p))return {id:command,executable:p,source:"known-path"};
  for(const p of pathCandidates(command))if(exists(p))return {id:command,executable:p,source:"path"};
  return {id:command,executable:null,source:"missing"};
}

export function discoverProviderCliExecutables(){
  const home=os.homedir();
  return [
    find("agent",[
      path.join(home,"AppData","Local","cursor-agent","agent.cmd")
    ]),
    find("claude",[
      path.join(home,".local","bin","claude.exe")
    ]),
    find("codex"),
    find("gemini"),
    find("opencode"),
    find("gh")
  ];
}
