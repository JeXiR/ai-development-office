import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type BackupMeta={
  id:string;
  createdAt:string;
  projectPath:string;
  backupPath:string;
  files:number;
};

function copyTree(src:string,dst:string){
  let count=0;
  if(!fs.existsSync(src))return count;
  fs.mkdirSync(dst,{recursive:true});
  for(const entry of fs.readdirSync(src,{withFileTypes:true})){
    const from=path.join(src,entry.name),to=path.join(dst,entry.name);
    if(entry.isDirectory())count+=copyTree(from,to);
    else if(entry.isFile()){fs.copyFileSync(from,to);count++;}
  }
  return count;
}

export class DisasterRecoveryService{
  create(projectPath:string,backupRoot:string){
    const id=crypto.randomUUID();
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    const backupPath=path.join(backupRoot,`${path.basename(projectPath)}-${stamp}-${id.slice(0,8)}`);
    fs.mkdirSync(backupPath,{recursive:true});

    let files=0;
    const aiKit=path.join(projectPath,".ai-kit");
    files+=copyTree(aiKit,path.join(backupPath,".ai-kit"));

    for(const file of ["package.json","package-lock.json","pnpm-lock.yaml","composer.json","composer.lock"]){
      const src=path.join(projectPath,file);
      if(fs.existsSync(src)){fs.copyFileSync(src,path.join(backupPath,file));files++;}
    }

    const meta:BackupMeta={id,createdAt:new Date().toISOString(),projectPath,backupPath,files};
    fs.writeFileSync(path.join(backupPath,"backup.json"),JSON.stringify(meta,null,2),"utf8");
    return meta;
  }

  restore(backupPath:string,projectPath:string){
    const aiKit=path.join(backupPath,".ai-kit");
    if(fs.existsSync(aiKit))copyTree(aiKit,path.join(projectPath,".ai-kit"));
    return {restored:true,backupPath,projectPath};
  }
}
