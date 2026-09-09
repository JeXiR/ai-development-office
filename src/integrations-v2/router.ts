import {IntegrationActions} from "./actions";
import {IntegrationRetryExecutor} from "./retry";
import {IntegrationAuditLog} from "./audit";
import type {IntegrationActionRequest,IntegrationActionResult} from "./types";

export class IntegrationActionRouter{
  private actions=new IntegrationActions();
  private retry=new IntegrationRetryExecutor();
  private audit=new IntegrationAuditLog();

  async execute(projectPath:string,request:IntegrationActionRequest,token:string|null):Promise<IntegrationActionResult>{
    const result=await this.retry.run(async attempt=>{
      const p=request.payload as any;
      let row:IntegrationActionResult;
      switch(`${request.integrationId}:${request.action}`){
        case "github:create_issue":
          row=await this.actions.githubCreateIssue({repo:String(p.repo||""),title:String(p.title||""),body:p.body?String(p.body):"",token},attempt);break;
        case "github:create_pr":
          row=await this.actions.githubCreatePullRequest({repo:String(p.repo||""),title:String(p.title||""),body:p.body?String(p.body):"",head:String(p.head||""),base:String(p.base||"main"),token},attempt);break;
        case "gitlab:create_mr":
          row=await this.actions.gitlabCreateMergeRequest({endpoint:String(p.endpoint||""),projectId:String(p.project_id||""),title:String(p.title||""),sourceBranch:String(p.source_branch||""),targetBranch:String(p.target_branch||"main"),token},attempt);break;
        case "slack:post_message":
          row=await this.actions.slackPostMessage({channel:String(p.channel||""),text:String(p.text||""),token},attempt);break;
        case "discord:post_message":
          row=await this.actions.discordWebhook({webhookUrl:String(p.webhook_url||""),content:String(p.content||"")},attempt);break;
        case "jira:create_issue":
          row=await this.actions.jiraCreateIssue({endpoint:String(p.endpoint||""),projectKey:String(p.project_key||""),summary:String(p.summary||""),description:p.description?String(p.description):"",token},attempt);break;
        case "linear:create_issue":
          row=await this.actions.linearCreateIssue({teamId:String(p.team_id||""),title:String(p.title||""),description:p.description?String(p.description):"",token},attempt);break;
        case "notion:create_page":
          row=await this.actions.notionCreatePage({parentPageId:String(p.parent_page_id||""),title:String(p.title||""),content:p.content?String(p.content):"",token},attempt);break;
        case "sentry:create_event":
          row=await this.actions.sentryCreateEvent({endpoint:String(p.endpoint||""),org:String(p.org||""),project:String(p.project||""),title:String(p.title||""),message:String(p.message||""),token},attempt);break;
        case "ci:get_status":
          row=await this.actions.ciStatus({url:String(p.url||""),token},attempt);break;
        case "webhook:trigger":
          row=await this.actions.genericWebhook({url:String(p.url||""),payload:p.payload??{},token},attempt);break;
        default:
          row={ok:false,status:400,data:null,message:"Unsupported integration action.",attempt,durationMs:0};
      }
      this.audit.append(request.projectId,projectPath,{
        integrationId:request.integrationId,action:request.action,actor:request.actor,
        status:row.ok?"success":attempt>1?"retrying":"failed",attempt,durationMs:row.durationMs,message:row.message,
        payloadSummary:{keys:Object.keys(request.payload)}
      });
      return row;
    });
    return result;
  }

  auditLog(projectPath:string,limit=500){return this.audit.list(projectPath,limit);}
}
