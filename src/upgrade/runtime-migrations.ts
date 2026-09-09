import fs from "node:fs";
import path from "node:path";

export type MigrationResult={
  from:number;
  to:number;
  applied:string[];
};

const CURRENT_SCHEMA=3;

function metaFile(dataDir:string){return path.join(dataDir,"runtime-schema.json");}

export function runtimeSchemaVersion(dataDir:string){
  try{return Number(JSON.parse(fs.readFileSync(metaFile(dataDir),"utf8"))?.version||1);}catch{return 1;}
}

export function migrateRuntimeState(dataDir:string):MigrationResult{
  fs.mkdirSync(dataDir,{recursive:true});
  let version=runtimeSchemaVersion(dataDir);
  const from=version;
  const applied:string[]=[];

  if(version<2){
    // Normalize missing JSON containers rather than mutating existing content.
    for(const file of ["provider-pins.json","approval-inbox.json"]){
      const p=path.join(dataDir,file);
      if(!fs.existsSync(p))fs.writeFileSync(p,"[]\n","utf8");
    }
    version=2;
    applied.push("v1→v2 runtime containers");
  }

  if(version<3){
    const p=path.join(dataDir,"migration-log.jsonl");
    fs.appendFileSync(p,JSON.stringify({at:new Date().toISOString(),migration:"v2-to-v3"})+"\n","utf8");
    version=3;
    applied.push("v2→v3 migration journal");
  }

  fs.writeFileSync(metaFile(dataDir),JSON.stringify({version,updatedAt:new Date().toISOString()},null,2)+"\n","utf8");
  return {from,to:version,applied};
}

export function currentRuntimeSchema(){return CURRENT_SCHEMA;}
