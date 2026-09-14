import {spawn,spawnSync} from "node:child_process";
import {launchWindowsInstallScript} from "../installer/windows-install-window";

export type PrerequisiteId="git"|"node"|"cursor"|"claude"|"codex"|"gemini"|"copilot"|"kimi"|"qwen"|"crush"|"pi"|"grok"|"opencode"|"ollama";
export type PrerequisiteStatus={id:PrerequisiteId;label:string;required:boolean;installed:boolean;executable:string|null;version:string|null;installHint:string};

const rows:Array<{id:PrerequisiteId;label:string;required:boolean;candidates:string[];installHint:string;npm?:string;brew?:string;winget?:string}>=[
  {id:"git",label:"Git",required:true,candidates:["git"],installHint:"winget install Git.Git",brew:"git",winget:"Git.Git"},
  {id:"node",label:"Node.js",required:true,candidates:["node"],installHint:"winget install OpenJS.NodeJS.LTS",brew:"node",winget:"OpenJS.NodeJS.LTS"},
  {id:"cursor",label:"Cursor Agent",required:false,candidates:["cursor-agent","agent.cmd"],installHint:"Install Cursor CLI / cursor-agent"},
  {id:"claude",label:"Claude Code",required:false,candidates:["claude","claude.exe"],installHint:"npm install -g @anthropic-ai/claude-code",npm:"@anthropic-ai/claude-code"},
  {id:"codex",label:"Codex CLI",required:false,candidates:["codex","codex.exe"],installHint:"npm install -g @openai/codex",npm:"@openai/codex"},
  {id:"gemini",label:"Gemini CLI",required:false,candidates:["gemini","gemini.cmd"],installHint:"npm install -g @google/gemini-cli",npm:"@google/gemini-cli"},
  {id:"copilot",label:"GitHub Copilot CLI",required:false,candidates:["copilot","copilot.exe"],installHint:"npm install -g @github/copilot",npm:"@github/copilot"},
  {id:"kimi",label:"Kimi Code CLI",required:false,candidates:["kimi","kimi.exe"],installHint:"npm install -g @moonshotai/kimi-cli",npm:"@moonshotai/kimi-cli"},
  {id:"qwen",label:"Qwen Code",required:false,candidates:["qwen","qwen.exe"],installHint:"npm install -g @qwen-code/qwen-code",npm:"@qwen-code/qwen-code"},
  {id:"crush",label:"Crush",required:false,candidates:["crush","crush.exe"],installHint:"Install Crush CLI from charmbracelet/crush"},
  {id:"pi",label:"Pi",required:false,candidates:["pi","pi.exe"],installHint:"Install Pi coding agent CLI"},
  {id:"grok",label:"Grok CLI",required:false,candidates:["grok","grok.exe"],installHint:"irm https://x.ai/cli/install.ps1 | iex"},
  {id:"opencode",label:"OpenCode",required:false,candidates:["opencode","opencode.exe"],installHint:"Install OpenCode CLI"},
  {id:"ollama",label:"Ollama",required:false,candidates:["ollama","ollama.exe"],installHint:"winget install Ollama.Ollama",brew:"ollama",winget:"Ollama.Ollama"}
];

function find(candidates:string[]){
  for(const c of candidates){
    const cmd=process.platform==="win32"?"where":"which";
    const r=spawnSync(cmd,[c],{encoding:"utf8",windowsHide:true});
    const f=String(r.stdout||"").split(/\r?\n/).map(x=>x.trim()).find(Boolean);
    if(f)return f;
  }
  return null;
}

function version(exe:string|null){
  if(!exe)return null;
  const r=spawnSync(exe,["--version"],{encoding:"utf8",timeout:4000,windowsHide:true});
  return String(r.stdout||r.stderr||"").trim().split(/\r?\n/)[0]||null;
}

export function checkPrerequisites():PrerequisiteStatus[]{
  return rows.map(x=>{
    const executable=find(x.candidates);
    return {id:x.id,label:x.label,required:x.required,installed:!!executable,executable,version:version(executable),installHint:x.installHint};
  });
}

function npmBin(){
  return process.platform==="win32"?"npm.cmd":"npm";
}

function resolveInstallCommand(row:typeof rows[number]){
  if(row.id==="grok"){
    return process.platform==="win32"
      ?"irm https://x.ai/cli/install.ps1 | iex"
      :"curl -fsSL https://x.ai/cli/install.sh | bash";
  }
  if(process.platform==="win32"){
    if(row.npm)return `${npmBin()} install -g ${row.npm}`;
    if(row.winget)return `winget install ${row.winget}`;
    return row.installHint;
  }
  if(process.platform==="darwin"&&row.brew&&find(["brew"]))return `brew install ${row.brew}`;
  if(row.npm)return `${npmBin()} install -g ${row.npm}`;
  return row.installHint;
}

function openUnixTerminal(command:string){
  const script=`printf '%s\\n' 'AI Development Office prerequisite installer' '${command.replace(/'/g,"'\\''")}'; ${command}; printf '\\nInstallation finished.\\n'`;
  const candidates=process.platform==="darwin"
    ?[["osascript",["-e",`tell application "Terminal" to do script "${command.replace(/"/g,"\\\"")}"`]]]
    :[["x-terminal-emulator",["-e","bash","-lc",script]],["gnome-terminal",["--","bash","-lc",script]],["konsole",["-e","bash","-lc",script]],["xterm",["-e","bash","-lc",script]]];
  for(const [bin,args] of candidates){
    if(bin!=="osascript"&&!find([bin]))continue;
    const child=spawn(bin,args,{detached:true,stdio:"ignore"});
    child.unref();
    return {started:true,message:"Installer opened in a separate terminal.",command};
  }
  const child=spawn("bash",["-lc",command],{detached:true,stdio:"ignore"});
  child.unref();
  return {started:true,message:"Installer started in the background.",command};
}

export function installPrerequisite(id:PrerequisiteId){
  const row=rows.find(x=>x.id===id);
  if(!row)throw new Error("Unknown prerequisite.");
  const command=resolveInstallCommand(row);
  if(!/^(winget|npm\.cmd|npm|brew|irm|curl)\b/i.test(command)){
    return {started:false,message:"Automatic installer is not configured for this provider.",command};
  }

  if(process.platform==="win32"){
    const launched=launchWindowsInstallScript(`AI Development Office · ${row.label}`,[command]);
    return {started:true,message:"Installer opened in a separate PowerShell window.",command,file:launched.file};
  }

  return openUnixTerminal(command);
}
