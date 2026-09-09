import {spawn} from "node:child_process";

export type ProviderInstallSpec={
  id:string;
  label:string;
  executable:string;
  args:string[];
};

export const providerInstallSpecs:Record<string,ProviderInstallSpec>={
  cursor:{id:"cursor",label:"Cursor Agent",executable:"powershell.exe",args:["-NoProfile","-ExecutionPolicy","Bypass","-Command","Write-Host 'Install Cursor Agent from Cursor settings / CLI tools.'; Read-Host 'Press Enter to close'"]},
  claude:{id:"claude",label:"Claude Code",executable:"powershell.exe",args:["-NoProfile","-ExecutionPolicy","Bypass","-Command","npm install -g @anthropic-ai/claude-code; Read-Host 'Press Enter to close'"]},
  codex:{id:"codex",label:"Codex CLI",executable:"powershell.exe",args:["-NoProfile","-ExecutionPolicy","Bypass","-Command","npm install -g @openai/codex; Read-Host 'Press Enter to close'"]},
  gemini:{id:"gemini",label:"Gemini CLI",executable:"powershell.exe",args:["-NoProfile","-ExecutionPolicy","Bypass","-Command","npm install -g @google/gemini-cli; Read-Host 'Press Enter to close'"]},
  opencode:{id:"opencode",label:"OpenCode",executable:"powershell.exe",args:["-NoProfile","-ExecutionPolicy","Bypass","-Command","Write-Host 'Install OpenCode using its official installer/package.'; Read-Host 'Press Enter to close'"]}
};

function quoteWin(part:string){
  return /[\s&|<>^"]/.test(part)?`"${part.replace(/"/g,'\\"')}"`:part;
}

function launchWindows(spec:ProviderInstallSpec){
  // detached + visible console + stdio:ignore throws spawn EINVAL on Windows.
  // `cmd /c start ""` opens a real window without that combination.
  const line=["start","",spec.executable,...spec.args].map(quoteWin).join(" ");
  const child=spawn(process.env.ComSpec||"cmd.exe",["/d","/s","/c",line],{
    detached:true,windowsHide:true,stdio:"ignore",shell:false
  });
  child.unref();
}

function launchUnix(spec:ProviderInstallSpec){
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
