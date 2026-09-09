import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type DesktopRuntimeConfig={
  officeRoot:string;
  dataDir:string;
  bridgePort:number;
  webPort:number;
  openBrowser:boolean;
  projectPath:string|null;
};

function loadEnvLocal(officeRoot:string){
  const file=path.join(officeRoot,".env.local");
  if(!fs.existsSync(file))return;

  const text=fs.readFileSync(file,"utf8");
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith("#"))continue;
    const index=line.indexOf("=");
    if(index<=0)continue;

    const key=line.slice(0,index).trim();
    let value=line.slice(index+1).trim();

    if(
      (value.startsWith('"')&&value.endsWith('"'))||
      (value.startsWith("'")&&value.endsWith("'"))
    ){
      value=value.slice(1,-1);
    }

    // Explicit shell environment wins over .env.local.
    if(process.env[key]===undefined)process.env[key]=value;
  }
}

export function desktopRuntimeConfig():DesktopRuntimeConfig{
  const officeRoot=process.cwd();
  loadEnvLocal(officeRoot);

  const dataDir=process.env.OFFICE_DATA_DIR||
    (process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA,"AI-Development-Office")
      : path.join(os.homedir(),".ai-development-office"));

  return {
    officeRoot,
    dataDir,
    bridgePort:Number(process.env.OFFICE_BRIDGE_PORT||8787),
    webPort:Number(process.env.OFFICE_WEB_PORT||3000),
    openBrowser:process.env.OFFICE_OPEN_BROWSER!=="0",
    projectPath:process.env.OFFICE_PROJECT_PATH||null
  };
}
