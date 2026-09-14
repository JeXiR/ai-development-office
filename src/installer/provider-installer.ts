import {spawn} from "node:child_process";
import {launchWindowsInstallScript} from "./windows-install-window";

export type ProviderInstallSpec={
  id:string;
  label:string;
  executable:string;
  args:string[];
  script?:string[];
};

export const providerInstallSpecs:Record<string,ProviderInstallSpec>={
  cursor:{id:"cursor",label:"Cursor Agent",executable:"powershell.exe",args:[],script:["Write-Host 'Install Cursor Agent from Cursor settings / CLI tools.'"]},
  claude:{id:"claude",label:"Claude Code",executable:"powershell.exe",args:[],script:["npm install -g @anthropic-ai/claude-code"]},
  codex:{id:"codex",label:"Codex CLI",executable:"powershell.exe",args:[],script:["npm install -g @openai/codex"]},
  gemini:{id:"gemini",label:"Gemini CLI",executable:"powershell.exe",args:[],script:["npm install -g @google/gemini-cli"]},
  grok:{id:"grok",label:"Grok CLI",executable:"powershell.exe",args:[],script:["irm https://x.ai/cli/install.ps1 | iex"]},
  opencode:{id:"opencode",label:"OpenCode",executable:"powershell.exe",args:[],script:["Write-Host 'Install OpenCode using its official installer/package.'"]}
};

function quoteWin(part:string){
  return /[\s&|<>^"]/.test(part)?`"${part.replace(/"/g,'\\"')}"`:part;
}

function launchWindows(spec:ProviderInstallSpec){
  if(spec.script?.length){
    launchWindowsInstallScript(`AI Development Office · ${spec.label}`, spec.script);
    return;
  }
  const line=["start","",spec.executable,...spec.args].map(quoteWin).join(" ");
  const child=spawn(process.env.ComSpec||"cmd.exe",["/d","/s","/c",line],{
    detached:true,windowsHide:true,stdio:"ignore",shell:false
  });
  child.unref();
}

function launchUnix(spec:ProviderInstallSpec){
  if(spec.id==="grok"){
    const child=spawn("bash",["-lc","curl -fsSL https://x.ai/cli/install.sh | bash"],{detached:true,stdio:"ignore"});
    child.unref();
    return;
  }
  const child=spawn(spec.executable,spec.args,{detached:true,stdio:"ignore"});
  child.unref();
}

export class ProviderInstaller{
  launch(id:string){
    const spec=providerInstallSpecs[id];
    if(!spec)throw new Error("Unsupported provider installer.");
    if(process.platform==="win32")launchWindows(spec);
    else launchUnix(spec);
    return {launched:true,id:spec.id,label:spec.label};
  }
}
