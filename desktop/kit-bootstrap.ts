import fs from "node:fs";
import path from "node:path";

export function verifyEmbeddedKit(officeRoot:string){
  const kitRoot=path.join(officeRoot,"engine","ai-development-kit");
  const manifest=path.join(kitRoot,"kit.manifest.json");
  if(!fs.existsSync(manifest))throw new Error("Embedded AI Development Kit manifest is missing.");
  const data=JSON.parse(fs.readFileSync(manifest,"utf8"));
  return {
    root:kitRoot,
    version:String(data.version||"unknown"),
    manifest
  };
}
