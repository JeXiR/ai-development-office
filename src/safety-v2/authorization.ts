import type {AuthorizationResult,PermissionPolicy,SandboxProfile} from "./types";
import {ApprovalStore} from "./approval-store";
import {DestructiveCommandClassifier} from "./classifier";

function normalizePath(value:string){
  return value.split("\\").join("/").replace("./","");
}

export class AuthorizationService{
  private approvals=new ApprovalStore();
  private classifier=new DestructiveCommandClassifier();

  protectedPath(relative:string,profile:SandboxProfile){
    const normalized=normalizePath(relative);
    return profile.protectedPaths.some(item=>{
      const protectedPath=normalizePath(item);
      const exact=protectedPath.endsWith("/")?protectedPath.slice(0,-1):protectedPath;
      return normalized===exact||normalized.startsWith(exact+"/");
    });
  }

  authorize(input:{
    projectId:string;
    projectPath:string;
    actor:string;
    action:"network"|"providerExecution"|"terminalWrite"|"terminalTerminate"|"filesystemWrite"|"shell";
    policy:PermissionPolicy;
    profile:SandboxProfile;
    resource?:string|null;
    command?:string|null;
    approvalId?:string|null;
  }):AuthorizationResult{
    if(input.approvalId&&this.approvals.isApproved(input.projectPath,input.approvalId)){
      return {allowed:true,requiresApproval:false,reason:"Approved by human gate.",approvalId:input.approvalId};
    }

    if(input.action==="filesystemWrite"&&input.resource&&this.protectedPath(input.resource,input.profile)){
      const approval=this.approvals.request(input.projectId,input.projectPath,{
        actor:input.actor,action:input.action,reason:"Protected path write requires approval.",risk:"high",resource:input.resource
      });
      return {allowed:false,requiresApproval:true,reason:"Protected path.",approvalId:approval.id};
    }

    if(input.action==="shell"&&input.command){
      const risk=this.classifier.classify(input.command);
      if(risk.destructive){
        const approval=this.approvals.request(input.projectId,input.projectPath,{
          actor:input.actor,action:"shell",reason:risk.reasons.join("; "),risk:risk.level,command:input.command
        });
        return {allowed:false,requiresApproval:true,reason:"Destructive command requires approval.",approvalId:approval.id};
      }
      if(!input.profile.allowShell){
        return {allowed:false,requiresApproval:false,reason:"Shell disabled by sandbox profile.",approvalId:null};
      }
    }

    if(input.action==="network"&&!input.profile.allowNetwork){
      return {allowed:false,requiresApproval:false,reason:"Network disabled by sandbox profile.",approvalId:null};
    }

    if(input.action==="filesystemWrite"&&!input.profile.allowFileWrite){
      return {allowed:false,requiresApproval:false,reason:"File writes disabled by sandbox profile.",approvalId:null};
    }

    const policyKey:keyof PermissionPolicy=input.action==="shell"?"providerExecution":input.action;
    const mode=input.policy[policyKey];

    if(mode==="deny"){
      return {allowed:false,requiresApproval:false,reason:"Denied by permission policy.",approvalId:null};
    }

    if(mode==="ask"){
      const approval=this.approvals.request(input.projectId,input.projectPath,{
        actor:input.actor,action:input.action,reason:"Permission policy requires approval.",risk:"medium",
        resource:input.resource??null,command:input.command??null
      });
      return {allowed:false,requiresApproval:true,reason:"Human approval required.",approvalId:approval.id};
    }

    return {allowed:true,requiresApproval:false,reason:"Allowed by policy.",approvalId:null};
  }
}
