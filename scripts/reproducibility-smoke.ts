import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {deterministicTaskId} from "../src/reproducibility/deterministic-id";
import {StateMigrationService} from "../src/reproducibility/migrations";
import {ProvenanceStore} from "../src/reproducibility/provenance";

const a=deterministicTaskId("p1","plan1","backend",0,"Implement API");
const b=deterministicTaskId("p1","plan1","backend",0,"Implement API");
if(a!==b)throw new Error("deterministic id failed");

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-repro-"));
const legacy=path.join(temp,"state.json");
fs.writeFileSync(legacy,JSON.stringify({hello:"world"}),"utf8");
const migration=new StateMigrationService().migrateJsonFile(legacy);
if(!migration.changed||migration.toVersion!==2)throw new Error("migration failed");

const project=path.join(temp,"project");
fs.mkdirSync(project,{recursive:true});
const provenance=new ProvenanceStore();
provenance.append("p1",project,{type:"execution",actor:"qa",action:"test",sourceTaskId:null,sourceSessionId:null,artifactPath:null,metadata:{ok:true}});
let count=0;
const result=provenance.replay(project,()=>count++);
if(result.replayed!==1||count!==1)throw new Error("replay failed");

console.log("Reproducibility smoke PASS");
