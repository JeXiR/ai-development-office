import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {atomicWriteJson} from "@/recovery/atomic-write";
import type {UpdateStage} from "./types";

function sha256(file:string){
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function copyTree(src:string,dst:string){
  fs.mkdirSync(dst,{recursive:true});
  for(const entry of fs.readdirSync(src,{withFileTypes:true})){
    if(["node_modules",".next",".git"].includes(entry.name))continue;
    const from=path.join(src,entry.name),to=path.join(dst,entry.name);
    if(entry.isDirectory())copyTree(from,to);
    else if(entry.isFile()){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}
  }
}

export class StagedUpdater{
  constructor(private readonly appDataRoot:string){}

  stage(sourcePath:string,version:string):UpdateStage{
    if(!fs.existsSync(sourcePath))throw new Error("Update source not found.");
    const id=crypto.randomUUID();
    const stagedPath=path.join(this.appDataRoot,"updates","staged",`${version}-${id.slice(0,8)}`);
    const rollbackPath=path.join(this.appDataRoot,"updates","rollback",`${version}-${id.slice(0,8)}`);
    fs.mkdirSync(stagedPath,{recursive:true});
    fs.mkdirSync(rollbackPath,{recursive:true});

    if(fs.statSync(sourcePath).isDirectory())copyTree(sourcePath,stagedPath);
    else fs.copyFileSync(sourcePath,path.join(stagedPath,path.basename(sourcePath)));

    const packageFile=path.join(stagedPath,"package.json");
    const manifestFile=path.join(stagedPath,"office.manifest.json");
    const payload=[packageFile,manifestFile].filter(fs.existsSync).map(sha256).join("");
    const digest=crypto.createHash("sha256").update(payload||id).digest("hex");
    const manifestPath=path.join(stagedPath,"update-stage.json");

    const stage:UpdateStage={
      id,version,sourcePath,stagedPath,manifestPath,sha256:digest,
      createdAt:new Date().toISOString(),verified:false
    };
    atomicWriteJson(manifestPath,stage);
    return stage;
  }

  verify(stage:UpdateStage){
    const packageFile=path.join(stage.stagedPath,"package.json");
    const manifestFile=path.join(stage.stagedPath,"office.manifest.json");
    if(!fs.existsSync(packageFile)||!fs.existsSync(manifestFile))return {...stage,verified:false};
    const pkg=JSON.parse(fs.readFileSync(packageFile,"utf8"));
    const manifest=JSON.parse(fs.readFileSync(manifestFile,"utf8"));
    const verified=String(pkg.version)===stage.version&&String(manifest.version)===stage.version;
    const next={...stage,verified};
    atomicWriteJson(stage.manifestPath,next);
    return next;
  }

  prepareRollback(currentRoot:string,stageId:string){
    const dst=path.join(this.appDataRoot,"updates","rollback",stageId);
    if(fs.existsSync(dst))fs.rmSync(dst,{recursive:true,force:true});
    copyTree(currentRoot,dst);
    return dst;
  }

  applyVerified(stage:UpdateStage,currentRoot:string){
    if(!stage.verified)throw new Error("Update stage is not verified.");
    const rollbackPath=this.prepareRollback(currentRoot,stage.id);
    copyTree(stage.stagedPath,currentRoot);
    return {applied:true,rollbackPath};
  }

  rollback(rollbackPath:string,currentRoot:string){
    if(!fs.existsSync(rollbackPath))throw new Error("Rollback snapshot not found.");
    copyTree(rollbackPath,currentRoot);
    return {rolledBack:true,rollbackPath};
  }
}
