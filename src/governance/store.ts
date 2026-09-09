import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {atomicWriteJson} from "@/recovery/atomic-write";
import type {
  GovernanceDecision,GovernanceEvidence,GovernanceMember,
  GovernancePolicy,GovernanceWaiver,ReleaseSignoff
} from "./types";

function now(){return new Date().toISOString();}

export class GovernanceStore{
  private root(projectPath:string){return path.join(projectPath,".ai-kit","governance");}
  private file(projectPath:string,name:string){return path.join(this.root(projectPath),name);}

  defaultPolicy(projectId:string):GovernancePolicy{
    return {
      version:1,projectId,
      requiredApprovals:{destructiveAction:1,release:1,policyChange:1,waiver:1},
      allowedRoles:{
        destructiveAction:["owner","maintainer"],
        release:["owner","maintainer","reviewer"],
        policyChange:["owner"],
        waiver:["owner","maintainer","reviewer"]
      },
      evidenceRetentionDays:365,
      auditRetentionDays:730,
      requireReleaseEvidence:true,
      requireNoCriticalWaivers:true,
      requireStableGateUnlocked:true,
      updatedAt:now(),updatedBy:"system"
    };
  }

  policy(projectId:string,projectPath:string){
    try{return {...this.defaultPolicy(projectId),...JSON.parse(fs.readFileSync(this.file(projectPath,"policy.json"),"utf8"))};}
    catch{return this.defaultPolicy(projectId);}
  }

  savePolicy(projectPath:string,policy:GovernancePolicy){
    atomicWriteJson(this.file(projectPath,"policy.json"),policy);
    return policy;
  }

  members(projectPath:string):GovernanceMember[]{
    try{const r=JSON.parse(fs.readFileSync(this.file(projectPath,"members.json"),"utf8"));return Array.isArray(r)?r:[];}
    catch{return [];}
  }

  saveMembers(projectPath:string,rows:GovernanceMember[]){atomicWriteJson(this.file(projectPath,"members.json"),rows);}

  upsertMember(projectPath:string,input:{id:string;displayName:string;role:GovernanceMember["role"];active?:boolean}){
    const rows=this.members(projectPath);
    const existing=rows.find(x=>x.id===input.id);
    if(existing){existing.displayName=input.displayName;existing.role=input.role;existing.active=input.active!==false;}
    else rows.push({id:input.id,displayName:input.displayName,role:input.role,active:input.active!==false,addedAt:now()});
    this.saveMembers(projectPath,rows);
    return rows.find(x=>x.id===input.id)!;
  }

  decisions(projectPath:string):GovernanceDecision[]{
    try{const r=JSON.parse(fs.readFileSync(this.file(projectPath,"decisions.json"),"utf8"));return Array.isArray(r)?r:[];}
    catch{return [];}
  }
  saveDecisions(projectPath:string,rows:GovernanceDecision[]){atomicWriteJson(this.file(projectPath,"decisions.json"),rows);}

  createDecision(projectId:string,projectPath:string,input:{title:string;rationale:string;proposedBy:string;supersedes?:string|null;evidenceIds?:string[]}){
    const rows=this.decisions(projectPath),stamp=now();
    const row:GovernanceDecision={
      id:crypto.randomUUID(),projectId,title:input.title,rationale:input.rationale,status:"proposed",
      proposedBy:input.proposedBy,approvedBy:[],rejectedBy:[],createdAt:stamp,updatedAt:stamp,
      supersedes:input.supersedes??null,evidenceIds:input.evidenceIds||[]
    };
    rows.push(row);this.saveDecisions(projectPath,rows);return row;
  }

  decideDecision(projectPath:string,id:string,memberId:string,approve:boolean){
    const rows=this.decisions(projectPath),row=rows.find(x=>x.id===id);
    if(!row)throw new Error("Governance decision not found.");
    const target=approve?row.approvedBy:row.rejectedBy;
    if(!target.includes(memberId))target.push(memberId);
    row.status=approve?"approved":"rejected";row.updatedAt=now();
    if(approve&&row.supersedes){
      const previous=rows.find(x=>x.id===row.supersedes);
      if(previous){previous.status="superseded";previous.updatedAt=now();}
    }
    this.saveDecisions(projectPath,rows);return row;
  }

  waivers(projectPath:string):GovernanceWaiver[]{
    try{const r=JSON.parse(fs.readFileSync(this.file(projectPath,"waivers.json"),"utf8"));return Array.isArray(r)?r:[];}
    catch{return [];}
  }
  saveWaivers(projectPath:string,rows:GovernanceWaiver[]){atomicWriteJson(this.file(projectPath,"waivers.json"),rows);}

  createWaiver(projectId:string,projectPath:string,input:{policyKey:string;reason:string;severity:GovernanceWaiver["severity"];requestedBy:string;expiresAt?:string|null}){
    const rows=this.waivers(projectPath);
    const row:GovernanceWaiver={
      id:crypto.randomUUID(),projectId,policyKey:input.policyKey,reason:input.reason,severity:input.severity,
      status:"active",requestedBy:input.requestedBy,approvedBy:[],createdAt:now(),expiresAt:input.expiresAt??null,revokedAt:null
    };
    rows.push(row);this.saveWaivers(projectPath,rows);return row;
  }

  approveWaiver(projectPath:string,id:string,memberId:string){
    const rows=this.waivers(projectPath),row=rows.find(x=>x.id===id);
    if(!row)throw new Error("Governance waiver not found.");
    if(!row.approvedBy.includes(memberId))row.approvedBy.push(memberId);
    this.saveWaivers(projectPath,rows);return row;
  }

  revokeWaiver(projectPath:string,id:string){
    const rows=this.waivers(projectPath),row=rows.find(x=>x.id===id);
    if(!row)throw new Error("Governance waiver not found.");
    row.status="revoked";row.revokedAt=now();this.saveWaivers(projectPath,rows);return row;
  }

  evidence(projectPath:string):GovernanceEvidence[]{
    try{const r=JSON.parse(fs.readFileSync(this.file(projectPath,"evidence.json"),"utf8"));return Array.isArray(r)?r:[];}
    catch{return [];}
  }
  saveEvidence(projectPath:string,rows:GovernanceEvidence[]){atomicWriteJson(this.file(projectPath,"evidence.json"),rows);}

  addEvidence(projectId:string,projectPath:string,input:{
    type:GovernanceEvidence["type"];label:string;status:GovernanceEvidence["status"];source:string;sha256?:string|null;metadata?:Record<string,unknown>;
  }){
    const rows=this.evidence(projectPath);
    const row:GovernanceEvidence={
      id:crypto.randomUUID(),projectId,type:input.type,label:input.label,status:input.status,source:input.source,
      sha256:input.sha256??null,createdAt:now(),metadata:input.metadata||{}
    };
    rows.push(row);this.saveEvidence(projectPath,rows);return row;
  }

  signoffs(projectPath:string):ReleaseSignoff[]{
    try{const r=JSON.parse(fs.readFileSync(this.file(projectPath,"release-signoffs.json"),"utf8"));return Array.isArray(r)?r:[];}
    catch{return [];}
  }
  saveSignoffs(projectPath:string,rows:ReleaseSignoff[]){atomicWriteJson(this.file(projectPath,"release-signoffs.json"),rows);}

  createSignoff(projectId:string,projectPath:string,input:{version:string;requestedBy:string;requiredApprovals:number;evidenceIds:string[];blockers:string[]}){
    const rows=this.signoffs(projectPath),stamp=now();
    const row:ReleaseSignoff={
      id:crypto.randomUUID(),projectId,version:input.version,requestedBy:input.requestedBy,
      requiredApprovals:Math.max(1,input.requiredApprovals),approvals:[],evidenceIds:input.evidenceIds,
      blockers:input.blockers,status:"pending",createdAt:stamp,updatedAt:stamp
    };
    rows.push(row);this.saveSignoffs(projectPath,rows);return row;
  }

  approveSignoff(projectPath:string,id:string,memberId:string){
    const rows=this.signoffs(projectPath),row=rows.find(x=>x.id===id);
    if(!row)throw new Error("Release signoff not found.");
    if(!row.approvals.some(x=>x.memberId===memberId))row.approvals.push({memberId,at:now()});
    if(!row.blockers.length&&row.approvals.length>=row.requiredApprovals)row.status="approved";
    row.updatedAt=now();this.saveSignoffs(projectPath,rows);return row;
  }

  prune(projectId:string,projectPath:string){
    const policy=this.policy(projectId,projectPath),nowMs=Date.now();
    const evidence=this.evidence(projectPath);
    const keptEvidence=evidence.filter(x=>(nowMs-Date.parse(x.createdAt))/86400000<=policy.evidenceRetentionDays);
    if(keptEvidence.length!==evidence.length)this.saveEvidence(projectPath,keptEvidence);
    return {evidenceBefore:evidence.length,evidenceAfter:keptEvidence.length};
  }
}
