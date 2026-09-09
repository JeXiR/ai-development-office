import {spawnSync} from "node:child_process";
export type PrerequisiteId="git"|"node"|"cursor"|"claude"|"codex"|"gemini"|"opencode"|"ollama";
export type PrerequisiteStatus={id:PrerequisiteId;label:string;required:boolean;installed:boolean;executable:string|null;version:string|null;installHint:string};
const rows:Array<{id:PrerequisiteId;label:string;required:boolean;candidates:string[];installHint:string}>=[
{id:"git",label:"Git",required:true,candidates:["git"],installHint:"winget install Git.Git"},{id:"node",label:"Node.js",required:true,candidates:["node"],installHint:"winget install OpenJS.NodeJS.LTS"},{id:"cursor",label:"Cursor Agent",required:false,candidates:["cursor-agent","agent.cmd"],installHint:"Install Cursor CLI / cursor-agent"},{id:"claude",label:"Claude Code",required:false,candidates:["claude","claude.exe"],installHint:"npm install -g @anthropic-ai/claude-code"},{id:"codex",label:"Codex CLI",required:false,candidates:["codex","codex.exe"],installHint:"npm install -g @openai/codex"},{id:"gemini",label:"Gemini CLI",required:false,candidates:["gemini","gemini.cmd"],installHint:"npm install -g @google/gemini-cli"},{id:"opencode",label:"OpenCode",required:false,candidates:["opencode","opencode.exe"],installHint:"Install OpenCode CLI"},{id:"ollama",label:"Ollama",required:false,candidates:["ollama","ollama.exe"],installHint:"winget install Ollama.Ollama"}];
function find(candidates:string[]){for(const c of candidates){const cmd=process.platform==="win32"?"where":"which";const r=spawnSync(cmd,[c],{encoding:"utf8",windowsHide:true});const f=String(r.stdout||"").split(/\r?\n/).map(x=>x.trim()).find(Boolean);if(f)return f;}return null;}
function version(exe:string|null){if(!exe)return null;const r=spawnSync(exe,["--version"],{encoding:"utf8",timeout:4000,windowsHide:true});return String(r.stdout||r.stderr||"").trim().split(/\r?\n/)[0]||null;}
export function checkPrerequisites():PrerequisiteStatus[]{return rows.map(x=>{const executable=find(x.candidates);return {...x,installed:!!executable,executable,version:version(executable)};});}
export function installPrerequisite(id:PrerequisiteId){
  const row=rows.find(x=>x.id===id);
  if(!row)throw new Error("Unknown prerequisite.");

  if(process.platform!=="win32"){
    return {started:false,message:`Automatic install is currently Windows-only. ${row.installHint}`,command:row.installHint};
  }

  let command=row.installHint;
  if(id==="claude")command="npm.cmd install -g @anthropic-ai/claude-code";
  if(id==="codex")command="npm.cmd install -g @openai/codex";
  if(id==="gemini")command="npm.cmd install -g @google/gemini-cli";

  if(!/^(winget|npm\.cmd|npm)\b/i.test(command)){
    return {started:false,message:"Automatic installer is not configured for this provider.",command};
  }

  const safeLabel=row.label.replace(/'/g,"''");
  const safeCommand=command.replace(/'/g,"''");
  const psCommand=`Write-Host 'AI Development Office prerequisite installer'; Write-Host ''; Write-Host '${safeLabel}'; Write-Host '${safeCommand}'; Write-Host ''; ${command}; Write-Host ''; Write-Host 'Installation finished. You can close this window.'`;

  const result=spawnSync(
    "cmd.exe",
    ["/c","start","","powershell.exe","-NoExit","-NoProfile","-ExecutionPolicy","Bypass","-Command",psCommand],
    {encoding:"utf8",windowsHide:true}
  );

  return {
    started:true,
    code:result.status,
    message:"Installer opened in a separate PowerShell window.",
    command
  };
}
