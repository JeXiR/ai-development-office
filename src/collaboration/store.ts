import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {
  BlackboardEntry,CollaborationArtifact,DirectorPlan,DirectorTask,MailMessage
} from "./types";

type ProjectData={
  tasks:DirectorTask[];
  messages:MailMessage[];
  blackboard:BlackboardEntry[];
  artifacts:CollaborationArtifact[];
  plans:DirectorPlan[];
};

function now(){return new Date().toISOString();}

export class CollaborationStore{
  private cache=new Map<string,ProjectData>();

  private file(projectPath:string){
    return path.join(projectPath,".ai-kit","office-collaboration","state.json");
  }

  private empty():ProjectData{
    return {tasks:[],messages:[],blackboard:[],artifacts:[],plans:[]};
  }

  load(projectId:string,projectPath:string){
    if(this.cache.has(projectId))return this.cache.get(projectId)!;
    const file=this.file(projectPath);
    let data=this.empty();
    try{
      const parsed=JSON.parse(fs.readFileSync(file,"utf8"));
      data={
        tasks:Array.isArray(parsed?.tasks)?parsed.tasks:[],
        messages:Array.isArray(parsed?.messages)?parsed.messages:[],
        blackboard:Array.isArray(parsed?.blackboard)?parsed.blackboard:[],
        artifacts:Array.isArray(parsed?.artifacts)?parsed.artifacts:[],
        plans:Array.isArray(parsed?.plans)?parsed.plans:[]
      };
    }catch{}
    this.cache.set(projectId,data);
    return data;
  }

  save(projectId:string,projectPath:string){
    const data=this.cache.get(projectId)||this.empty();
    const file=this.file(projectPath);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const tmp=file+".tmp";
    fs.writeFileSync(tmp,JSON.stringify(data,null,2),"utf8");
    fs.renameSync(tmp,file);
  }

  createPlan(projectId:string,projectPath:string,goal:string,tasks:Array<Omit<DirectorTask,"id"|"projectId"|"createdAt"|"updatedAt"|"status">>){
    const data=this.load(projectId,projectPath);
    const createdAt=now();
    const rows:DirectorTask[]=tasks.map(task=>({
      ...task,
      id:crypto.randomUUID(),
      projectId,
      status:"planned",
      createdAt,
      updatedAt:createdAt
    }));
    const plan:DirectorPlan={id:crypto.randomUUID(),projectId,goal,tasks:rows,createdAt};
    data.tasks.push(...rows);
    data.plans.push(plan);
    this.save(projectId,projectPath);
    return plan;
  }

  updateTask(projectId:string,projectPath:string,taskId:string,patch:Partial<DirectorTask>){
    const data=this.load(projectId,projectPath);
    const task=data.tasks.find(x=>x.id===taskId);
    if(!task)throw new Error("Director task not found.");
    Object.assign(task,patch,{updatedAt:now()});
    this.save(projectId,projectPath);
    return task;
  }

  sendMessage(projectId:string,projectPath:string,input:Omit<MailMessage,"id"|"projectId"|"createdAt"|"readAt">){
    const data=this.load(projectId,projectPath);
    const row:MailMessage={...input,id:crypto.randomUUID(),projectId,createdAt:now(),readAt:null};
    data.messages.push(row);
    this.save(projectId,projectPath);
    return row;
  }

  markRead(projectId:string,projectPath:string,messageId:string){
    const data=this.load(projectId,projectPath);
    const row=data.messages.find(x=>x.id===messageId);
    if(!row)throw new Error("Message not found.");
    row.readAt=now();
    this.save(projectId,projectPath);
    return row;
  }

  addBlackboard(projectId:string,projectPath:string,input:Omit<BlackboardEntry,"id"|"projectId"|"createdAt"|"updatedAt">){
    const data=this.load(projectId,projectPath);
    const createdAt=now();
    const row:BlackboardEntry={...input,id:crypto.randomUUID(),projectId,createdAt,updatedAt:createdAt};
    data.blackboard.push(row);
    this.save(projectId,projectPath);
    return row;
  }

  addArtifact(projectId:string,projectPath:string,input:Omit<CollaborationArtifact,"id"|"projectId"|"createdAt">){
    const data=this.load(projectId,projectPath);
    const row:CollaborationArtifact={...input,id:crypto.randomUUID(),projectId,createdAt:now()};
    data.artifacts.push(row);
    this.save(projectId,projectPath);
    return row;
  }

  snapshot(projectId:string,projectPath:string){
    return this.load(projectId,projectPath);
  }
}
