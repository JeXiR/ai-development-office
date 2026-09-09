import fs from "node:fs";
import path from "node:path";
import {atomicWriteJson} from "@/recovery/atomic-write";
import type {IntegrationConfig,IntegrationId,IntegrationStatus,McpServerConfig} from "./types";

const defaults:IntegrationConfig[]=[
  {id:"mcp",enabled:true,label:"MCP",endpoint:null,tokenEnv:null,metadata:{}},
  {id:"github",enabled:false,label:"GitHub",endpoint:null,tokenEnv:"GITHUB_TOKEN",metadata:{}},
  {id:"gitlab",enabled:false,label:"GitLab",endpoint:null,tokenEnv:"GITLAB_TOKEN",metadata:{}},
  {id:"slack",enabled:false,label:"Slack",endpoint:null,tokenEnv:"SLACK_TOKEN",metadata:{}},
  {id:"discord",enabled:false,label:"Discord",endpoint:null,tokenEnv:"DISCORD_TOKEN",metadata:{}},
  {id:"webhook",enabled:false,label:"Webhook",endpoint:null,tokenEnv:null,metadata:{}},
  {id:"jira",enabled:false,label:"Jira",endpoint:null,tokenEnv:"JIRA_TOKEN",metadata:{}},
  {id:"linear",enabled:false,label:"Linear",endpoint:null,tokenEnv:"LINEAR_TOKEN",metadata:{}},
  {id:"notion",enabled:false,label:"Notion",endpoint:null,tokenEnv:"NOTION_TOKEN",metadata:{}},
  {id:"sentry",enabled:false,label:"Sentry",endpoint:null,tokenEnv:"SENTRY_AUTH_TOKEN",metadata:{}},
  {id:"ci",enabled:false,label:"CI",endpoint:null,tokenEnv:null,metadata:{}}
];

export class IntegrationRegistry{
  private file(projectPath:string){
    return path.join(projectPath,".ai-kit","integrations","config.json");
  }

  load(projectPath:string){
    try{
      const raw=JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"));
      const rows=Array.isArray(raw)?raw:[];
      return defaults.map(def=>({...def,...rows.find((x:any)=>x.id===def.id)}));
    }catch{
      return defaults.map(x=>({...x}));
    }
  }

  save(projectPath:string,rows:IntegrationConfig[]){
    atomicWriteJson(this.file(projectPath),rows);
  }

  update(projectPath:string,id:IntegrationId,patch:Partial<IntegrationConfig>){
    const rows=this.load(projectPath);
    const index=rows.findIndex(x=>x.id===id);
    if(index<0)throw new Error("Unknown integration.");
    rows[index]={...rows[index],...patch,id};
    this.save(projectPath,rows);
    return rows[index];
  }

  status(projectPath:string):IntegrationStatus[]{
    return this.load(projectPath).map(row=>{
      const credentialPresent=!row.tokenEnv||!!process.env[row.tokenEnv];
      const configured=row.id==="mcp"||!!row.endpoint||credentialPresent;
      return {
        id:row.id,
        configured,
        enabled:row.enabled,
        endpoint:row.endpoint,
        credentialPresent,
        message:configured?"Configured":"Missing endpoint or credential"
      };
    });
  }
}

export class McpManager{
  private file(projectPath:string){
    return path.join(projectPath,".ai-kit","integrations","mcp-servers.json");
  }

  list(projectPath:string):McpServerConfig[]{
    try{
      const raw=JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"));
      return Array.isArray(raw)?raw:[];
    }catch{return [];}
  }

  save(projectPath:string,rows:McpServerConfig[]){
    atomicWriteJson(this.file(projectPath),rows);
  }

  upsert(projectPath:string,row:McpServerConfig){
    if(!/^[A-Za-z0-9._-]{1,80}$/.test(row.id))throw new Error("Invalid MCP server id.");
    const rows=this.list(projectPath);
    const i=rows.findIndex(x=>x.id===row.id);
    if(i>=0)rows[i]=row;else rows.push(row);
    this.save(projectPath,rows);
    return row;
  }

  remove(projectPath:string,id:string){
    const rows=this.list(projectPath).filter(x=>x.id!==id);
    this.save(projectPath,rows);
    return true;
  }
}
