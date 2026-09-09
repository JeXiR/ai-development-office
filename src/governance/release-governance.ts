import {GovernanceStore} from "./store";

export class ReleaseGovernanceService{
  constructor(private readonly store=new GovernanceStore()){}

  evaluate(projectId:string,projectPath:string,stableUnlocked:boolean){
    const policy=this.store.policy(projectId,projectPath);
    const evidence=this.store.evidence(projectPath);
    const waivers=this.store.waivers(projectPath).filter(x=>x.status==="active"&&(!x.expiresAt||Date.parse(x.expiresAt)>Date.now()));

    const blockers:string[]=[];
    if(policy.requireStableGateUnlocked&&!stableUnlocked)blockers.push("stable_gate_locked");
    if(policy.requireReleaseEvidence&&!evidence.some(x=>x.status==="pass"))blockers.push("missing_release_evidence");
    if(policy.requireNoCriticalWaivers&&waivers.some(x=>x.severity==="critical"))blockers.push("critical_waiver_active");

    return {
      eligible:blockers.length===0,
      blockers,
      evidenceCount:evidence.length,
      passingEvidenceCount:evidence.filter(x=>x.status==="pass").length,
      activeWaivers:waivers.length,
      requiredReleaseApprovals:policy.requiredApprovals.release
    };
  }
}
