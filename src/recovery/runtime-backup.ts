import fs from "node:fs";
import path from "node:path";

const IMPORTANT_FILES=[
  "projects.json",
  "settings.json",
  "provider-policy.json",
  "provider-pins.json",
  "provider-credentials.secure.json",
  "approval-inbox.json",
  "mission-history.jsonl",
  "mission-events.jsonl",
  "provider-quality.jsonl",
  "integration-events.jsonl",
  "command-history.json",
  "audit-trail.jsonl"
];

export type BackupManifest={
  version:1;
  createdAt:string;
  files:Array<{name:string;bytes:number;sha256:string}>;
};

function sha256(file:string){
  const crypto=require("node:crypto");
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function createRuntimeBackup(dataDir:string,backupDir:string){
  fs.mkdirSync(backupDir,{recursive:true});
  const stamp=new Date().toISOString().replace(/[:.]/g,"-");
  const target=path.join(backupDir,`backup-${stamp}`);
  fs.mkdirSync(target,{recursive:true});

  const files:BackupManifest["files"]=[];
  for(const name of IMPORTANT_FILES){
    const src=path.join(dataDir,name);
    if(!fs.existsSync(src))continue;
    const stat=fs.statSync(src);
    if(!stat.isFile())continue;
    const dst=path.join(target,name);
    fs.copyFileSync(src,dst);
    files.push({name,bytes:stat.size,sha256:sha256(dst)});
  }

  const manifest:BackupManifest={version:1,createdAt:new Date().toISOString(),files};
  fs.writeFileSync(path.join(target,"manifest.json"),JSON.stringify(manifest,null,2)+"\n","utf8");
  return {target,manifest};
}

export function validateBackup(backupPath:string){
  const manifest:BackupManifest=JSON.parse(fs.readFileSync(path.join(backupPath,"manifest.json"),"utf8"));
  const issues:string[]=[];
  for(const row of manifest.files){
    const file=path.join(backupPath,row.name);
    if(!fs.existsSync(file)){issues.push(`missing: ${row.name}`);continue;}
    if(sha256(file)!==row.sha256)issues.push(`checksum mismatch: ${row.name}`);
  }
  return {ok:issues.length===0,issues,manifest};
}

export function restoreRuntimeBackup(dataDir:string,backupPath:string){
  const validation=validateBackup(backupPath);
  if(!validation.ok)throw new Error(`Backup validation failed: ${validation.issues.join(", ")}`);
  fs.mkdirSync(dataDir,{recursive:true});
  for(const row of validation.manifest.files){
    fs.copyFileSync(path.join(backupPath,row.name),path.join(dataDir,row.name));
  }
  return {restored:validation.manifest.files.map(x=>x.name),createdAt:validation.manifest.createdAt};
}
