import fs from "node:fs";
import path from "node:path";
import {buildReleaseEvidence} from "../src/release/stable-promotion";

const pkg=JSON.parse(fs.readFileSync(path.join(process.cwd(),"package.json"),"utf8"));
const version=String(pkg.version);

const pending=buildReleaseEvidence({
  version,
  typecheck:true,
  build:true,
  betaGate:true,
  rc1Gate:true,
  rc2Gate:null,
  callMeValidation:null,
  npmAuditReviewed:null,
  securityManualReview:null,
  packagingVerified:true
});
if(pending.stableEligible)throw new Error("Pending evidence must not unlock Stable");

const pass=buildReleaseEvidence({
  version,
  typecheck:true,
  build:true,
  betaGate:true,
  rc1Gate:true,
  rc2Gate:true,
  callMeValidation:true,
  npmAuditReviewed:true,
  securityManualReview:true,
  packagingVerified:true
});
if(!pass.stableEligible)throw new Error("Complete evidence should unlock Stable");

console.log(`Stable Promotion smoke PASS: ${version}`);
