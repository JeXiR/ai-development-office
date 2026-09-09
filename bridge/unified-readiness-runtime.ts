import fs from "node:fs";
import path from "node:path";
import {inspectProjectDocs} from "./project-intelligence-runtime";
import {credentialSnapshot} from "./provider-credential-runtime";
import {accountConnectionSnapshot} from "./account-connection-runtime";
import {providerAssignmentSnapshot} from "./provider-policy-runtime";
import {desktopRuntimeStatus} from "./desktop-runtime-status";
import type {IntegrationCheck,IntegrationSnapshot} from "../src/integration/contracts";

function check(id:string,subsystem:any,ok:boolean,severity:"info"|"warning"|"error",message:string,evidence?:unknown):IntegrationCheck{
  return {id,subsystem,ok,severity,message,evidence};
}

export async function unifiedReadiness(projectPath?:string|null):Promise<IntegrationSnapshot>{
  const checks:IntegrationCheck[]=[];
  const root=process.cwd();

  // Embedded Kit
  const kitManifest=path.join(root,"engine","ai-development-kit","kit.manifest.json");
  checks.push(check(
    "kit.manifest","kit",fs.existsSync(kitManifest),
    fs.existsSync(kitManifest)?"info":"error",
    fs.existsSync(kitManifest)?"Embedded Kit manifest present":"Embedded Kit manifest missing",
    {path:kitManifest}
  ));

  // Project docs
  if(projectPath){
    try{
      const docs=inspectProjectDocs(projectPath);
      checks.push(check(
        "docs.project-state","docs",
        Boolean(docs.snapshot.progressFile&&docs.snapshot.stateFile),
        docs.snapshot.progressFile&&docs.snapshot.stateFile?"info":"warning",
        docs.snapshot.progressFile&&docs.snapshot.stateFile
          ?"Project progress/state detected"
          :"Project progress/state incomplete",
        {warnings:docs.snapshot.warnings,nextMission:docs.nextMission}
      ));
    }catch(error:any){
      checks.push(check("docs.scan","docs",false,"warning","Project docs scan failed",String(error?.message||error)));
    }
  }else{
    checks.push(check("docs.project","docs",false,"warning","No active project path available"));
  }

  // Provider assignments / policy
  try{
    const assignments=providerAssignmentSnapshot();
    checks.push(check(
      "providers.policy","providers",Boolean(assignments?.policy),
      assignments?.policy?"info":"warning",
      assignments?.policy?"Provider policy loaded":"Provider policy missing",
      {pins:assignments?.pins?.length||0}
    ));
  }catch(error:any){
    checks.push(check("providers.policy","providers",false,"warning","Provider policy snapshot failed",String(error?.message||error)));
  }

  // Credentials
  try{
    const creds=credentialSnapshot();
    const configured=creds.filter((x:any)=>x.present).length;
    checks.push(check(
      "providers.credentials","providers",configured>0,
      configured>0?"info":"warning",
      configured>0?`${configured} provider credential source(s) configured`:"No provider API credentials configured",
      {configured,total:creds.length}
    ));
  }catch(error:any){
    checks.push(check("providers.credentials","providers",false,"warning","Provider credential snapshot failed",String(error?.message||error)));
  }

  // Account connections
  try{
    const accounts=await accountConnectionSnapshot();
    const installed=accounts.filter((x:any)=>x.installed).length;
    const authenticated=accounts.filter((x:any)=>x.authenticated).length;
    checks.push(check(
      "auth.connections","auth",installed>0,
      installed>0?"info":"warning",
      installed>0?`${installed} account CLI(s) installed, ${authenticated} authenticated`:"No account-login CLI detected",
      {installed,authenticated,total:accounts.length}
    ));
  }catch(error:any){
    checks.push(check("auth.connections","auth",false,"warning","Account connection snapshot failed",String(error?.message||error)));
  }

  // Desktop runtime
  try{
    const desktop=desktopRuntimeStatus();
    checks.push(check(
      "desktop.runtime","desktop",Boolean(desktop.ready),
      desktop.ready?"info":"error",
      desktop.ready?"Desktop/Bridge runtime ready":"Desktop runtime not ready",
      desktop
    ));
  }catch(error:any){
    checks.push(check("desktop.runtime","desktop",false,"error","Desktop runtime status failed",String(error?.message||error)));
  }

  // Project execution foundations
  const projectExecutionFiles=[
    "src/project-execution/tool-executor.ts",
    "src/project-execution/command-tools.ts",
    "src/project-execution/git-tools.ts",
    "bridge/real-project-execution-runtime.ts"
  ];
  const allExec=projectExecutionFiles.every(rel=>fs.existsSync(path.join(root,rel)));
  checks.push(check(
    "project-execution.foundation","project-execution",allExec,
    allExec?"info":"error",
    allExec?"Real project execution foundation present":"Real project execution foundation incomplete",
    projectExecutionFiles
  ));

  // Evidence/safety
  const safetyExists=fs.existsSync(path.join(root,"src/orchestration/approval-gates.ts"));
  const evidenceExists=fs.existsSync(path.join(root,"src/orchestration/evidence.ts"));
  checks.push(check("safety.approval-gates","safety",safetyExists,safetyExists?"info":"error",safetyExists?"Approval gates present":"Approval gates missing"));
  checks.push(check("evidence.store","evidence",evidenceExists,evidenceExists?"info":"error",evidenceExists?"Evidence store present":"Evidence store missing"));

  // Pixel Office
  const pixelRenderer=fs.existsSync(path.join(root,"src/pixel-office-v2/renderer.ts"));
  const pixelMovement=fs.existsSync(path.join(root,"src/pixel-office-v2/movement.ts"));
  checks.push(check(
    "pixel-office.v2","pixel-office",pixelRenderer&&pixelMovement,
    pixelRenderer&&pixelMovement?"info":"error",
    pixelRenderer&&pixelMovement?"Pixel Office V2 renderer/movement present":"Pixel Office V2 incomplete"
  ));

  const errors=checks.filter(x=>!x.ok&&x.severity==="error").length;
  const warnings=checks.filter(x=>!x.ok&&x.severity==="warning").length;
  return {
    at:new Date().toISOString(),
    checks,
    errors,
    warnings,
    ready:errors===0
  };
}
