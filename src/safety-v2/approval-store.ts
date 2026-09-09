import fs from "node:fs";import path from "node:path";import crypto from "node:crypto";import {atomicWriteJson} from "@/recovery/atomic-write";import type {ApprovalRequest,RiskLevel} from "./types";
export class ApprovalStore{
 private file(projectPath:string){return path.join(projectPath,".ai-kit","safety","approvals.json");}
 list(projectPath:string):ApprovalRequest[]{try{const r=JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"));return Array.isArray(r)?r:[];}catch{return [];}}
 request(projectId:string,projectPath:string,input:{actor:string;action:string;reason:string;risk:RiskLevel;resource?:string|null;command?:string|null;ttlMinutes?:number;}){
  const rows=this.list(projectPath),now=new Date(),ttl=input.ttlMinutes??30;
  const row:ApprovalRequest={id:crypto.randomUUID(),projectId,actor:input.actor,action:input.action,reason:input.reason,risk:input.risk,resource:input.resource??null,command:input.command??null,createdAt:now.toISOString(),expiresAt:ttl>0?new Date(now.getTime()+ttl*60000).toISOString():null,decision:"pending",decidedAt:null,decidedBy:null};
  rows.push(row);atomicWriteJson(this.file(projectPath),rows.slice(-1000));return row;
 }
 decide(projectPath:string,id:string,decision:"approved"|"rejected",actor:string){const rows=this.list(projectPath),row=rows.find(x=>x.id===id);if(!row)throw new Error("Approval request not found.");if(row.decision==="pending"){if(row.expiresAt&&Date.parse(row.expiresAt)<Date.now())row.decision="expired";else{row.decision=decision;row.decidedAt=new Date().toISOString();row.decidedBy=actor;}atomicWriteJson(this.file(projectPath),rows);}return row;}
 isApproved(projectPath:string,id:string){const row=this.list(projectPath).find(x=>x.id===id);return !!row&&row.decision==="approved"&&(!row.expiresAt||Date.parse(row.expiresAt)>=Date.now());}
}
