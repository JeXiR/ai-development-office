import {spawnSync} from "node:child_process";
import type {PrerequisiteCheck} from "./types";

const defs:Array<Omit<PrerequisiteCheck,"status"|"version">>=[
  {id:"node",label:"Node.js",command:"node",args:["--version"],installHint:"Install Node.js LTS."},
  {id:"npm",label:"npm",command:"npm",args:["--version"],installHint:"Installed with Node.js."},
  {id:"git",label:"Git",command:"git",args:["--version"],installHint:"Install Git for Windows."},
  {id:"powershell",label:"PowerShell",command:"powershell.exe",args:["-NoProfile","-Command","$PSVersionTable.PSVersion.ToString()"],installHint:"Use Windows PowerShell or PowerShell 7."},
  {id:"docker",label:"Docker",command:"docker",args:["--version"],installHint:"Install Docker Desktop if Docker workers are required."},
  {id:"ssh",label:"OpenSSH",command:"ssh",args:["-V"],installHint:"Enable the Windows OpenSSH client."}
];

export class PrerequisiteDetector{
  check():PrerequisiteCheck[]{
    return defs.map(def=>{
      try{
        const result=spawnSync(def.command,def.args,{encoding:"utf8",timeout:5000,windowsHide:true});
        const text=String(result.stdout||result.stderr||"").trim();
        const ok=result.status===0||!!text;
        return {...def,status:ok?"detected":"missing",version:ok?text.slice(0,300):null};
      }catch{
        return {...def,status:"missing",version:null};
      }
    });
  }
}
