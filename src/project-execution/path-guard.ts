import fs from "node:fs";
import path from "node:path";

const BLOCKED_NAMES=new Set([
  ".env",".env.local",".env.production",".env.development",
  "id_rsa","id_ed25519",".npmrc",".pypirc"
]);

export function resolveProjectPath(projectRoot:string,inputPath:string,options:{allowMissing?:boolean;allowSensitive?:boolean}={}){
  const root=path.resolve(projectRoot);
  const target=path.resolve(root,inputPath||".");
  const rel=path.relative(root,target);

  if(rel.startsWith("..")||path.isAbsolute(rel)&&rel!==target)throw new Error("Path escapes project root.");
  const base=path.basename(target).toLowerCase();
  if(!options.allowSensitive&&BLOCKED_NAMES.has(base))throw new Error(`Sensitive file access blocked: ${base}`);

  if(!options.allowMissing&&!fs.existsSync(target))throw new Error(`Path not found: ${inputPath}`);
  return target;
}

export function isBlockedProjectPath(file:string){
  const base=path.basename(file).toLowerCase();
  return BLOCKED_NAMES.has(base);
}
