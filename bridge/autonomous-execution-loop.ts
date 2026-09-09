import path from "node:path";
import os from "node:os";
import {EventEmitter} from "node:events";
import {planAutonomousProviderMission} from "./autonomous-provider-orchestrator";
import {getUniversalProviderRuntime} from "./provider-universal-runtime";
import {ProviderTelemetryLedger} from "../src/provider-sdk/telemetry";
import {MissionHistoryStore} from "../src/orchestration/history";
import {ProviderQualityStore} from "../src/provider-sdk/quality-feedback";
import {DEFAULT_MISSION_RETRY_POLICY,shouldRetryAgent} from "../src/orchestration/retry-policy";
import {classifyApprovalNeed} from "../src/orchestration/approval-gates";
import {evaluateAgentResults,reviewMissionResult} from "../src/orchestration/stages";
import {MissionEvidenceStore} from "../src/orchestration/evidence";
import {ApprovalInboxStore} from "../src/orchestration/approval-inbox";
import {MissionEventJournal} from "../src/orchestration/event-journal";
import {recordMissionProgress} from "../src/project-intelligence/progress-updater";
import type {MissionExecutionEvent,MissionExecutionSummary} from "../src/orchestration/execution-types";

function dataDir(){
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA,"AI-Development-Office")
    : path.join(os.homedir(),".ai-development-office");
}

class AutonomousExecutionLoop{
  private events=new EventEmitter();
  private cancelled=new Set<string>();
  private telemetry=new ProviderTelemetryLedger(dataDir());
  private history=new MissionHistoryStore(dataDir());
  private quality=new ProviderQualityStore(dataDir());
  private evidence=new MissionEvidenceStore(dataDir());
  private approvals=new ApprovalInboxStore(dataDir());
  private journal=new MissionEventJournal(dataDir());

  subscribe(listener:(event:MissionExecutionEvent)=>void){
    this.events.on("event",listener);
    return()=>this.events.off("event",listener);
  }

  private emit(event:MissionExecutionEvent){this.journal.append(event);this.events.emit("event",event);}

  cancel(missionId:string){this.cancelled.add(missionId);return true;}

  async execute(data:any):Promise<MissionExecutionSummary>{
    const approval=classifyApprovalNeed(String(data?.goal||""));
    if(approval.required&&!data?.approved){
      const missionId=crypto.randomUUID();
      const approvalItem={
        id:`approval-${missionId}`,
        missionId,
        goal:String(data?.goal||""),
        risk:approval.risk,
        reasons:approval.reasons,
        status:"pending" as const,
        createdAt:new Date().toISOString(),
        decidedAt:null
      };
      this.approvals.add(approvalItem);
      this.emit({missionId,type:"mission.approval_required",at:new Date().toISOString(),data:{approval,...approvalItem}});
      return {
        missionId,
        status:"queued",
        startedAt:new Date().toISOString(),
        completedAt:null,
        agentResults:[],
        finalResult:{approvalRequired:true,approval},
        errors:[]
      };
    }

    const plan=await planAutonomousProviderMission(data);
    const missionId=plan.missionId;
    const startedAt=new Date().toISOString();
    const results:MissionExecutionSummary["agentResults"]=[];
    const errors:string[]=[];
    const retryPolicy={...DEFAULT_MISSION_RETRY_POLICY,...(data?.retryPolicy||{})};

    this.emit({missionId,type:"mission.planned",at:new Date().toISOString(),data:plan});

    for(const assignment of plan.assignments){
      if(this.cancelled.has(missionId)){
        this.emit({missionId,type:"mission.cancelled",at:new Date().toISOString()});
        return {missionId,status:"cancelled",startedAt,completedAt:new Date().toISOString(),agentResults:results,finalResult:null,errors};
      }

      let attempt=0;
      let completed=false;
      let finalRow:any=null;

      while(!completed&&attempt<retryPolicy.maxAgentAttempts){
        attempt++;
        const runtime=getUniversalProviderRuntime();
        const began=Date.now();
        this.emit({
          missionId,
          type:attempt===1?"agent.started":"agent.retrying",
          agentId:assignment.agentId,
          providerId:assignment.providerId,
          at:new Date().toISOString(),
          data:{attempt}
        });

        try{
          const result=await runtime.execute({
            prompt:[
              `Mission: ${plan.goal}`,
              `Agent role: ${assignment.role}`,
              `Resolved Kit capabilities: ${plan.kitCapabilities.join(", ")}`,
              "Work on your assigned portion. Return a concise implementation/result summary and any blockers."
            ].join("\n"),
            model:assignment.model||undefined,
            route:{
              preferredProvider:assignment.providerId||undefined,
              requires:Object.entries(plan.requirements).filter(([k,v])=>Boolean(v)&&k!=="localPreferred").map(([k])=>k) as any[]
            }
          });

          const elapsed=Date.now()-began;
          const lastAttempt=result.attempts[result.attempts.length-1];
          const ok=result.ok;
          finalRow={
            agentId:assignment.agentId,
            providerId:result.providerId,
            ok,
            output:result.output,
            error:ok?null:(lastAttempt?.error||"Provider execution failed"),
            attempts:attempt
          };

          this.telemetry.append({
            at:new Date().toISOString(),
            missionId,
            agentId:assignment.agentId,
            providerId:(result.providerId||assignment.providerId||"openai") as any,
            model:assignment.model,
            latencyMs:elapsed,
            inputTokens:null,
            outputTokens:null,
            costUsd:null,
            ok,
            error:finalRow.error
          });

          if(result.providerId){
            const score=ok?1:0;
            this.quality.append({
              providerId:result.providerId,
              taskType:"development",
              score,
              latencyMs:elapsed,
              ok,
              at:new Date().toISOString()
            });
          }

          const retry=shouldRetryAgent({
            attempt,
            ok,
            output:result.output,
            error:finalRow.error
          },retryPolicy);

          if(retry){
            await new Promise(r=>setTimeout(r,retryPolicy.retryDelayMs));
            continue;
          }

          completed=true;
          if(!ok)errors.push(`${assignment.agentId}: ${finalRow.error}`);
          this.emit({
            missionId,
            type:ok?"agent.completed":"agent.failed",
            agentId:assignment.agentId,
            providerId:result.providerId,
            at:new Date().toISOString(),
            data:{attempts:attempt,elapsedMs:elapsed}
          });
        }catch(error:any){
          const message=String(error?.message||error);
          finalRow={
            agentId:assignment.agentId,
            providerId:assignment.providerId,
            ok:false,
            output:null,
            error:message,
            attempts:attempt
          };
          const retry=shouldRetryAgent({attempt,ok:false,output:null,error:message},retryPolicy);
          if(retry){
            await new Promise(r=>setTimeout(r,retryPolicy.retryDelayMs));
            continue;
          }
          completed=true;
          errors.push(`${assignment.agentId}: ${message}`);
          this.emit({
            missionId,
            type:"agent.failed",
            agentId:assignment.agentId,
            providerId:assignment.providerId,
            at:new Date().toISOString(),
            message
          });
        }
      }

      if(finalRow)results.push(finalRow);
    }

    this.emit({missionId,type:"mission.testing",at:new Date().toISOString()});
    const testStage=evaluateAgentResults(results);
    this.emit({missionId,type:"mission.test_result",at:new Date().toISOString(),data:testStage});

    const succeeded=results.filter(x=>x.ok);
    const finalResult:any={
      goal:plan.goal,
      completedAgents:succeeded.map(x=>x.agentId),
      failedAgents:results.filter(x=>!x.ok).map(x=>x.agentId),
      results:succeeded.map(x=>({agentId:x.agentId,providerId:x.providerId,output:x.output})),
      testStage
    };

    this.emit({missionId,type:"mission.reviewing",at:new Date().toISOString()});
    const reviewStage=reviewMissionResult(finalResult);
    finalResult["reviewStage"]=reviewStage;
    this.emit({missionId,type:"mission.review_result",at:new Date().toISOString(),data:reviewStage});

    const status=testStage.ok&&reviewStage.ok?"completed":"failed";
    const completedAt=new Date().toISOString();
    this.emit({missionId,type:`mission.${status}`,at:completedAt,data:finalResult});

    const summary:MissionExecutionSummary={
      missionId,
      status,
      startedAt,
      completedAt,
      agentResults:results,
      finalResult,
      errors
    };

    this.history.append({
      missionId,
      goal:plan.goal,
      projectId:plan.projectId,
      status,
      startedAt,
      completedAt,
      result:finalResult,
      errors,
      providerSummary:results.map(x=>({
        agentId:x.agentId,
        providerId:x.providerId,
        attempts:x.attempts,
        ok:x.ok
      }))
    });

    this.evidence.write({
      missionId,
      createdAt:new Date().toISOString(),
      goal:plan.goal,
      projectId:plan.projectId,
      projectPath:plan.projectPath,
      kitCapabilities:plan.kitCapabilities,
      assignments:plan.assignments,
      providerAttempts:results.map(x=>({agentId:x.agentId,providerId:x.providerId,attempts:x.attempts,ok:x.ok,error:x.error})),
      testStage,
      reviewStage,
      approval:null,
      finalResult:{...finalResult,status}
    });

    try{
      recordMissionProgress({
        projectPath:plan.projectPath,
        missionId,
        goal:plan.goal,
        status:status==="completed"?"PARTIAL":testStage.ok?"PARTIAL":"BLOCKED",
        summary:status==="completed"
          ?`Provider orchestration completed with ${succeeded.length} successful agent(s); real project validation is still required before VERIFIED_DONE.`
          :`Mission did not complete cleanly. ${errors.join(" | ")}`,
        evidence:[
          `Test stage: ${testStage.ok?"PASS":"FAIL"}`,
          `Review stage: ${reviewStage.ok?"PASS":"FAIL"}`,
          `Providers: ${results.map(x=>`${x.agentId}:${x.providerId||"none"}`).join(", ")}`
        ]
      });
    }catch(error:any){
      this.emit({missionId,type:"mission.progress_sync_failed",at:new Date().toISOString(),message:String(error?.message||error)});
    }

    return summary;
  }

}

let loop:AutonomousExecutionLoop|null=null;
export function getAutonomousExecutionLoop(){
  if(!loop)loop=new AutonomousExecutionLoop();
  return loop;
}
