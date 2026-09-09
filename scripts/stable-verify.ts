import fs from "node:fs";
import path from "node:path";
import {verifyVersionConsistency} from "../src/release/version-consistency";
import {verifyIntegrityManifest} from "../src/release/package-integrity";

const root=process.cwd();
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
const currentVersion=String(pkg.version);
const version=verifyVersionConsistency(root,currentVersion);
if(!version.ok){
  console.error(version.issues);
  process.exit(1);
}

const integrity=verifyIntegrityManifest(root);
if(!integrity.ok){
  console.error(integrity.issues);
  process.exit(1);
}

const manifest=JSON.parse(fs.readFileSync(path.join(root,"office.manifest.json"),"utf8"));
if(manifest.releaseTrain?.remainingPlannedReleases!==0){
  throw new Error("Stable release train must report 0 remaining releases.");
}
if(manifest.release?.channel!=="stable"){
  throw new Error("Stable manifest channel mismatch.");
}

console.log("Stable package verification PASS");
console.log(JSON.stringify({
  version:manifest.version,
  validationStatus:manifest.release?.validationStatus,
  stableGateUnlocked:manifest.release?.stableGateUnlocked,
  files:integrity.manifest?.files?.length||0
},null,2));
