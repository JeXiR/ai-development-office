import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import {buildReleaseEvidence} from "../src/release/stable-promotion";
import {verifyVersionConsistency} from "../src/release/version-consistency";
import {verifyIntegrityManifest} from "../src/release/package-integrity";
import {FinalAcceptanceStore} from "../src/release/final-acceptance-store";

function dataDir(){
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA,"AI-Development-Office")
    : path.join(os.homedir(),".ai-development-office");
}

const store=new FinalAcceptanceStore(dataDir());

export function currentFinalAcceptance(){
  return store.read();
}

export function versionConsistency(){
  const manifest=JSON.parse(fs.readFileSync(path.join(process.cwd(),"office.manifest.json"),"utf8"));
  return verifyVersionConsistency(process.cwd(),String(manifest.version));
}

export function packageIntegrity(){
  const result=verifyIntegrityManifest(process.cwd());
  const issues=result.issues||[];
  return {
    ok:result.ok,
    issueCount:issues.length,
    issues:issues.slice(0,12),
    createdAt:result.manifest?.createdAt||null,
    rootVersion:result.manifest?.rootVersion||null,
    fileCount:result.manifest?.files?.length||0
  };
}

export function updateFinalAcceptance(data:any){
  const version=String(data?.version||JSON.parse(fs.readFileSync(path.join(process.cwd(),"office.manifest.json"),"utf8")).version);
  const bundle=buildReleaseEvidence({
    version,
    typecheck:data?.typecheck??null,
    build:data?.build??null,
    betaGate:data?.betaGate??null,
    rc1Gate:data?.rc1Gate??null,
    rc2Gate:data?.rc2Gate??null,
    callMeValidation:data?.callMeValidation??null,
    npmAuditReviewed:data?.npmAuditReviewed??null,
    securityManualReview:data?.securityManualReview??null,
    packagingVerified:data?.packagingVerified??null
  });
  return store.write(bundle);
}
