import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const supervisor=fs.readFileSync(path.join(root,"desktop","process-supervisor.ts"),"utf8");
const runtimeConfig=fs.readFileSync(path.join(root,"desktop","runtime-config.ts"),"utf8");
const desktopPs=fs.readFileSync(path.join(root,"office-desktop.ps1"),"utf8");
const officePs=fs.readFileSync(path.join(root,"office.ps1"),"utf8");

if(!supervisor.includes('process.env.ComSpec||"cmd.exe"')){
  throw new Error("Windows cmd.exe wrapper missing from ProcessSupervisor.");
}
if(!supervisor.includes('["/d","/s","/c",escaped]')){
  throw new Error("Windows npm command wrapper arguments missing.");
}
if(!runtimeConfig.includes("loadEnvLocal")){
  throw new Error(".env.local loader missing from desktop runtime config.");
}
if(!desktopPs.includes('Test-Path ".env.local"')){
  throw new Error("Desktop launcher clean-install env bootstrap missing.");
}
if(officePs.includes('then run .\\office.ps1 again')){
  throw new Error("Legacy first-run forced-exit behavior remains.");
}

console.log("Desktop Windows Launch smoke PASS");
