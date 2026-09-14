import fs from "node:fs";
import path from "node:path";

export function bundledNodePath(officeRoot:string){
  const env=process.env.OFFICE_BUNDLED_NODE;
  if(env&&fs.existsSync(env))return env;
  const win=path.join(officeRoot,"runtime","node","node.exe");
  const unix=path.join(officeRoot,"runtime","node","bin","node");
  if(fs.existsSync(win))return win;
  if(fs.existsSync(unix))return unix;
  return null;
}

export function resolveOfficeNode(officeRoot:string){
  return bundledNodePath(officeRoot)||process.execPath;
}

export function usesBundledNode(officeRoot:string){
  return !!bundledNodePath(officeRoot);
}
