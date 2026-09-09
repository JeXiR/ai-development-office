import fs from "node:fs";
import path from "node:path";

export type SecurityGateResult={
  passed:boolean;
  checks:Array<{id:string;ok:boolean;message:string}>;
};

export function securityReadiness(officeRoot:string):SecurityGateResult{
  const checks=[
    {
      id:"credential.stdin-dpapi",
      ok:fs.readFileSync(path.join(officeRoot,"src/provider-sdk/credentials.ts"),"utf8").includes("In.ReadToEnd"),
      message:"Windows credential encryption uses stdin-based DPAPI input"
    },
    {
      id:"operation.policy",
      ok:fs.existsSync(path.join(officeRoot,"src/security/operation-policy.ts")),
      message:"Central operation security policy exists"
    },
    {
      id:"path.guard",
      ok:fs.existsSync(path.join(officeRoot,"src/project-execution/path-guard.ts")),
      message:"Project path isolation guard exists"
    },
    {
      id:"approval.gates",
      ok:fs.existsSync(path.join(officeRoot,"src/orchestration/approval-gates.ts")),
      message:"Approval gate foundation exists"
    },
    {
      id:"backup.restore",
      ok:fs.existsSync(path.join(officeRoot,"src/recovery/runtime-backup.ts")),
      message:"Runtime backup/restore exists"
    },
    {
      id:"schema.migration",
      ok:fs.existsSync(path.join(officeRoot,"src/upgrade/runtime-migrations.ts")),
      message:"Runtime migration framework exists"
    }
  ];
  return {passed:checks.every(x=>x.ok),checks};
}
