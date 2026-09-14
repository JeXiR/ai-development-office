import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";

export const WIN_CMD_LINE_LIMIT=7500;
export const WIN_CREATEPROCESS_LIMIT=24000;

export function sanitizeSpawnArg(value:string){
  return String(value).replace(/\0/g,"").replace(/\r?\n/g," ").trimEnd();
}

export function windowsComSpec(){
  const fromEnv=process.env.ComSpec;
  if(fromEnv&&fs.existsSync(fromEnv))return fromEnv;
  const fallback=path.join(process.env.SYSTEMROOT||"C:\\Windows","System32","cmd.exe");
  return fs.existsSync(fallback)?fallback:"cmd.exe";
}

export function spawnEnv(extra:Record<string,string|undefined>={}){
  const out:Record<string,string>={};
  for(const [key,value] of Object.entries({...process.env,...extra})){
    if(typeof value!=="string"||!key||key.includes("="))continue;
    out[key]=value.replace(/\0/g,"");
  }
  if(process.platform==="win32"){
    if(!out.SYSTEMROOT)out.SYSTEMROOT=process.env.SYSTEMROOT||"C:\\Windows";
    if(!out.WINDIR)out.WINDIR=process.env.WINDIR||out.SYSTEMROOT;
    if(!out.ComSpec)out.ComSpec=windowsComSpec();
  }
  return out;
}

const RANK:Record<string,number>={
  ".exe":0,
  ".cmd":1,
  ".bat":2,
  ".com":3,
  ".ps1":6
};

export function scoreWindowsCli(file:string){
  const ext=path.extname(file).toLowerCase();
  if(!ext)return 5;
  return RANK[ext]??4;
}

export function collectWhereHits(name:string){
  const cmd=process.platform==="win32"?"where.exe":"which";
  try{
    const r=spawnSync(cmd,[name],{encoding:"utf8",windowsHide:true,timeout:4000});
    if(r.status!==0)return [];
    return String(r.stdout||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  }catch{
    return [];
  }
}

export function preferWindowsCli(candidates:string[]){
  const existing=candidates.filter(p=>p&&fs.existsSync(p));
  if(!existing.length)return null;
  return existing.slice().sort((a,b)=>scoreWindowsCli(a)-scoreWindowsCli(b)||a.localeCompare(b))[0];
}

function quoteCmd(command:string, args:string[]){
  return [command,...args].map(part=>{
    const text=sanitizeSpawnArg(part);
    if(!/[\s"]/.test(text))return text;
    return `"${text.replace(/"/g,'\\"')}"`;
  }).join(" ");
}

export function commandLineLength(command:string, args:string[]=[]){
  return quoteCmd(command,args).length;
}

function powershellLiteral(value:string){
  return `'${String(value).replace(/'/g,"''")}'`;
}

export function writeWindowsLaunchScript(command:string, args:string[]=[]){
  const dir=path.join(os.tmpdir(),"office-cli-launch");
  fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}.ps1`);
  const script=[
    "$ErrorActionPreference='Stop'",
    `$cmd=${powershellLiteral(command)}`,
    `$cliArgs=@(${args.map(powershellLiteral).join(",")})`,
    "& $cmd @cliArgs"
  ].join("\r\n");
  fs.writeFileSync(file,script);
  return file;
}

export function writeWindowsCmdLaunch(command:string, args:string[]=[]){
  const dir=path.join(os.tmpdir(),"office-cli-launch");
  fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}.cmd`);
  fs.writeFileSync(file,`@echo off\r\n${quoteCmd(command,args)}\r\n`);
  return file;
}

function cmdFileLaunch(command:string, args:string[]){
  return {
    command:windowsComSpec(),
    args:["/d","/s","/c",writeWindowsCmdLaunch(command,args)]
  };
}

export function unwrapCursorAgentShim(command:string){
  const resolved=path.resolve(command);
  const base=path.basename(resolved).toLowerCase();
  if(!/^(agent\.cmd|cursor-agent\.cmd|cursor-agent\.ps1|cursor-agent)$/i.test(base))return null;
  const root=path.dirname(resolved);
  const versionsDir=path.join(root,"versions");
  if(!fs.existsSync(versionsDir))return null;
  const versions=fs.readdirSync(versionsDir,{withFileTypes:true})
    .filter(entry=>entry.isDirectory()&&/^\d{4}\.\d{1,2}\.\d{1,2}/.test(entry.name))
    .map(entry=>entry.name)
    .sort()
    .reverse();
  for(const name of versions){
    const node=path.join(versionsDir,name,"node.exe");
    const index=path.join(versionsDir,name,"index.js");
    if(fs.existsSync(node)&&fs.existsSync(index))return {command:node,prefixArgs:[index]};
  }
  return null;
}

export function wrapWindowsCli(command:string, args:string[]=[]){
  let safeArgs=args.map(sanitizeSpawnArg);
  if(!String(command||"").trim()){
    throw new Error("Cannot spawn an empty CLI command.");
  }
  if(process.platform!=="win32")return {command,args:safeArgs};
  let resolved=command;
  const ext=path.extname(resolved).toLowerCase();
  if(!ext){
    const sibling=preferWindowsCli([resolved+".cmd",resolved+".exe",resolved+".bat",resolved+".ps1"]);
    if(sibling)resolved=sibling;
  }
  const shim=unwrapCursorAgentShim(resolved);
  if(shim){
    resolved=shim.command;
    safeArgs=[...shim.prefixArgs,...safeArgs];
  }
  const kind=path.extname(resolved).toLowerCase();
  const comspec=windowsComSpec();
  if(kind===".ps1"){
    const psArgs=["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",resolved,...safeArgs];
    if(commandLineLength("powershell.exe",psArgs)>WIN_CMD_LINE_LIMIT){
      return cmdFileLaunch("powershell.exe",psArgs);
    }
    return {command:"powershell.exe",args:psArgs};
  }
  if(kind===".cmd"||kind===".bat"){
    const line=quoteCmd(resolved,safeArgs);
    if(line.length>WIN_CMD_LINE_LIMIT){
      const exe=preferWindowsCli([resolved.replace(/\.(cmd|bat)$/i,".exe")]);
      if(exe&&commandLineLength(exe,safeArgs)<=WIN_CREATEPROCESS_LIMIT)return {command:exe,args:safeArgs};
      return cmdFileLaunch(resolved,safeArgs);
    }
    return {command:comspec,args:["/d","/s","/c",line]};
  }
  if(commandLineLength(resolved,safeArgs)>WIN_CREATEPROCESS_LIMIT){
    return cmdFileLaunch(resolved,safeArgs);
  }
  return {command:resolved,args:safeArgs};
}
