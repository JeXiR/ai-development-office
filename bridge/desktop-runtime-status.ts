import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function desktopRuntimeStatus(){
  const root=process.cwd();
  let kitVersion:string|null=null;
  try{
    const manifest=JSON.parse(fs.readFileSync(path.join(root,"engine","ai-development-kit","kit.manifest.json"),"utf8"));
    kitVersion=String(manifest.version||"unknown");
  }catch{}

  return {
    ready:true,
    bridgeUrl:`ws://127.0.0.1:${process.env.OFFICE_BRIDGE_PORT||8787}`,
    webUrl:`http://127.0.0.1:${process.env.OFFICE_WEB_PORT||3000}`,
    projectPath:process.env.OFFICE_PROJECT_PATH||null,
    kitVersion
  };
}
