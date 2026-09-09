import fs from "node:fs";
import path from "node:path";
import {OFFICE_STATE_SCHEMA_VERSION,type VersionedStateEnvelope} from "./schema";

export type MigrationResult={
  file:string;
  fromVersion:number;
  toVersion:number;
  changed:boolean;
  backup:string|null;
};

function detectVersion(raw:any){
  if(typeof raw?.schemaVersion==="number")return raw.schemaVersion;
  return 1;
}

export class StateMigrationService{
  migrateJsonFile(file:string):MigrationResult{
    if(!fs.existsSync(file))return {file,fromVersion:0,toVersion:OFFICE_STATE_SCHEMA_VERSION,changed:false,backup:null};
    const raw=JSON.parse(fs.readFileSync(file,"utf8"));
    const from=detectVersion(raw);
    if(from>=OFFICE_STATE_SCHEMA_VERSION){
      return {file,fromVersion:from,toVersion:from,changed:false,backup:null};
    }

    const backup=`${file}.schema-v${from}.bak`;
    fs.copyFileSync(file,backup);

    let payload=raw?.payload??raw;
    let version=from;

    if(version===1){
      const envelope:VersionedStateEnvelope={
        schemaVersion:2,
        writtenAt:new Date().toISOString(),
        payload
      };
      fs.writeFileSync(file,JSON.stringify(envelope,null,2),"utf8");
      version=2;
    }

    return {file,fromVersion:from,toVersion:version,changed:true,backup};
  }

  migrateProject(projectPath:string){
    const candidates=[
      path.join(projectPath,".ai-kit","memory","state.json"),
      path.join(projectPath,".ai-kit","automation","state.json"),
      path.join(projectPath,".ai-kit","telemetry","ledger.json"),
      path.join(projectPath,".ai-kit","office-collaboration","state.json")
    ];
    return candidates.filter(fs.existsSync).map(file=>this.migrateJsonFile(file));
  }
}
