import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawn} from "node:child_process";

function powershellExe(){
  const root=process.env.SYSTEMROOT||process.env.SystemRoot||"C:\\Windows";
  const full=path.join(root,"System32","WindowsPowerShell","v1.0","powershell.exe");
  return fs.existsSync(full)?full:"powershell.exe";
}

function quoteCmd(value:string){
  return `"${String(value).replace(/"/g,'\\"')}"`;
}

export function writeWindowsInstallScript(title:string, lines:string[]){
  const dir=path.join(os.tmpdir(),"office-cli-install");
  fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}.ps1`);
  const body=[
    "$ErrorActionPreference='Stop'",
    `Write-Host ${JSON.stringify(title)}`,
    "Write-Host ''",
    ...lines,
    "Write-Host ''",
    "Write-Host 'Installation finished. You can close this window.'",
    "Read-Host 'Press Enter to close'"
  ].join("\r\n");
  fs.writeFileSync(file,body);
  return file;
}

export function launchWindowsInstallScript(title:string, lines:string[]){
  const file=writeWindowsInstallScript(title,lines);
  const ps=powershellExe();
  const line=["start","",quoteCmd(ps),"-NoExit","-NoProfile","-ExecutionPolicy","Bypass","-File",quoteCmd(file)].join(" ");
  const child=spawn(process.env.ComSpec||"cmd.exe",["/d","/s","/c",line],{
    detached:true,windowsHide:true,stdio:"ignore",shell:false
  });
  child.unref();
  return {started:true,file,command:`powershell -File ${file}`};
}
