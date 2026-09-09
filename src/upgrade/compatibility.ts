import fs from "node:fs";
import path from "node:path";
import {currentRuntimeSchema,runtimeSchemaVersion} from "./runtime-migrations";

export function checkUpgradeCompatibility(officeRoot:string,dataDir:string){
  const issues:string[]=[];
  let manifest:any=null;
  try{manifest=JSON.parse(fs.readFileSync(path.join(officeRoot,"office.manifest.json"),"utf8"));}catch{
    issues.push("office.manifest.json missing or invalid");
  }

  const runtimeSchema=runtimeSchemaVersion(dataDir);
  const supported=currentRuntimeSchema();
  if(runtimeSchema>supported)issues.push(`Runtime schema ${runtimeSchema} is newer than supported ${supported}.`);

  const kitManifest=path.join(officeRoot,"engine","ai-development-kit","kit.manifest.json");
  if(!fs.existsSync(kitManifest))issues.push("Embedded Kit manifest missing.");

  return {
    ok:issues.length===0,
    issues,
    officeVersion:manifest?.version||null,
    runtimeSchema,
    supportedRuntimeSchema:supported
  };
}
