import crypto from "node:crypto";
import os from "node:os";
import * as pty from "node-pty";
import {RuntimeEventBus} from "./event-bus";
import type {
  RuntimeSessionSnapshot,
  RuntimeSessionStatus,
  SpawnRuntimeSessionInput
} from "./types";

type ManagedSession={
  snapshot:RuntimeSessionSnapshot;
  process:pty.IPty;
  constrained:boolean;
  paused:boolean;
};

function now(){return new Date().toISOString();}

export class AgentProcessManager{
  private sessions=new Map<string,ManagedSession>();

  constructor(private readonly events:RuntimeEventBus){}

  list(projectId?:string){
    return [...this.sessions.values()]
      .map(x=>({...x.snapshot}))
      .filter(x=>!projectId||x.projectId===projectId)
      .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  }

  get(sessionId:string){
    const row=this.sessions.get(sessionId);
    return row?{...row.snapshot}:null;
  }

  spawn(input:SpawnRuntimeSessionInput){
    const id=crypto.randomUUID();
    const createdAt=now();
    const snapshot:RuntimeSessionSnapshot={
      id,
      projectId:input.projectId,
      projectPath:input.projectPath,
      agentId:input.agentId,
      role:input.role,
      provider:input.provider,
      status:"starting",
      pid:null,
      cols:Math.max(40,input.cols||120),
      rows:Math.max(10,input.rows||32),
      createdAt,
      startedAt:null,
      exitedAt:null,
      exitCode:null,
      lastActivityAt:createdAt,
      command:[input.executable,...(input.args||[])].join(" ")
    };

    this.events.publish({
      type:"runtime.session.starting",
      sessionId:id,
      projectId:input.projectId,
      agentId:input.agentId,
      role:input.role,
      provider:input.provider,
      payload:{cwd:input.cwd||input.projectPath,command:snapshot.command}
    });

    try{
      const env={
        ...process.env,
        ...(input.env||{}),
        TERM:process.env.TERM||"xterm-256color",
        COLORTERM:process.env.COLORTERM||"truecolor"
      } as Record<string,string>;

      const child=pty.spawn(input.executable,input.args||[],{
        name:"xterm-256color",
        cols:snapshot.cols,
        rows:snapshot.rows,
        cwd:input.cwd||input.projectPath,
        env
      });

      snapshot.pid=child.pid;
      snapshot.status="running";
      snapshot.startedAt=now();
      snapshot.lastActivityAt=snapshot.startedAt;

      this.sessions.set(id,{snapshot,process:child,constrained:false,paused:false});

      child.onData(data=>{
        snapshot.lastActivityAt=now();
        this.events.publish({
          type:"runtime.session.output",
          sessionId:id,
          projectId:snapshot.projectId,
          agentId:snapshot.agentId,
          role:snapshot.role,
          provider:snapshot.provider,
          payload:{data}
        });
      });

      child.onExit(({exitCode,signal})=>{
        snapshot.status="exited";
        snapshot.exitCode=exitCode;
        snapshot.exitedAt=now();
        snapshot.lastActivityAt=snapshot.exitedAt;
        this.events.publish({
          type:"runtime.session.exited",
          sessionId:id,
          projectId:snapshot.projectId,
          agentId:snapshot.agentId,
          role:snapshot.role,
          provider:snapshot.provider,
          payload:{exitCode,signal}
        });
      });

      this.events.publish({
        type:"runtime.session.started",
        sessionId:id,
        projectId:snapshot.projectId,
        agentId:snapshot.agentId,
        role:snapshot.role,
        provider:snapshot.provider,
        payload:{pid:snapshot.pid,cols:snapshot.cols,rows:snapshot.rows}
      });

      return {...snapshot};
    }catch(error){
      snapshot.status="failed";
      snapshot.exitedAt=now();
      snapshot.lastActivityAt=snapshot.exitedAt;
      const message=error instanceof Error?error.message:String(error);
      this.events.publish({
        type:"runtime.session.failed",
        sessionId:id,
        projectId:snapshot.projectId,
        agentId:snapshot.agentId,
        role:snapshot.role,
        provider:snapshot.provider,
        payload:{message}
      });
      throw error;
    }
  }

  write(sessionId:string,data:string){
    const session=this.sessions.get(sessionId);
    if(!session||session.snapshot.status!=="running")throw new Error("Runtime session is not running.");
    session.process.write(data);
    session.snapshot.lastActivityAt=now();
    this.events.publish({
      type:"runtime.session.input",
      sessionId,
      projectId:session.snapshot.projectId,
      agentId:session.snapshot.agentId,
      role:session.snapshot.role,
      provider:session.snapshot.provider,
      payload:{bytes:Buffer.byteLength(data)}
    });
  }

  resize(sessionId:string,cols:number,rows:number){
    const session=this.sessions.get(sessionId);
    if(!session||session.snapshot.status!=="running")throw new Error("Runtime session is not running.");
    const safeCols=Math.max(40,Math.min(400,Math.floor(cols)));
    const safeRows=Math.max(10,Math.min(160,Math.floor(rows)));
    session.process.resize(safeCols,safeRows);
    session.snapshot.cols=safeCols;
    session.snapshot.rows=safeRows;
    session.snapshot.lastActivityAt=now();
    this.events.publish({
      type:"runtime.session.resized",
      sessionId,
      projectId:session.snapshot.projectId,
      agentId:session.snapshot.agentId,
      role:session.snapshot.role,
      provider:session.snapshot.provider,
      payload:{cols:safeCols,rows:safeRows}
    });
  }

  pause(sessionId:string){
    const session=this.sessions.get(sessionId);
    if(!session||session.snapshot.status!=="running")throw new Error("Runtime session is not running.");
    session.paused=true;
    session.snapshot.lastActivityAt=now();
    this.events.publish({
      type:"runtime.session.input",
      sessionId,
      projectId:session.snapshot.projectId,
      agentId:session.snapshot.agentId,
      role:session.snapshot.role,
      provider:session.snapshot.provider,
      payload:{control:"pause"}
    });
    return true;
  }

  resume(sessionId:string){
    const session=this.sessions.get(sessionId);
    if(!session||session.snapshot.status!=="running")throw new Error("Runtime session is not running.");
    session.paused=false;
    session.constrained=false;
    session.snapshot.lastActivityAt=now();
    this.events.publish({
      type:"runtime.session.input",
      sessionId,
      projectId:session.snapshot.projectId,
      agentId:session.snapshot.agentId,
      role:session.snapshot.role,
      provider:session.snapshot.provider,
      payload:{control:"resume"}
    });
    return true;
  }

  steer(sessionId:string,message:string){
    const session=this.sessions.get(sessionId);
    if(!session||session.snapshot.status!=="running")throw new Error("Runtime session is not running.");
    const payload=`\r\n[OFFICE STEER] ${message}\r\n`;
    session.process.write(payload);
    session.snapshot.lastActivityAt=now();
    this.events.publish({
      type:"runtime.session.input",
      sessionId,
      projectId:session.snapshot.projectId,
      agentId:session.snapshot.agentId,
      role:session.snapshot.role,
      provider:session.snapshot.provider,
      payload:{control:"steer",message}
    });
    return true;
  }

  constrain(sessionId:string,message:string){
    const session=this.sessions.get(sessionId);
    if(!session||session.snapshot.status!=="running")throw new Error("Runtime session is not running.");
    session.constrained=true;
    const payload=`\r\n[OFFICE CONSTRAINT] ${message}\r\n`;
    session.process.write(payload);
    session.snapshot.lastActivityAt=now();
    this.events.publish({
      type:"runtime.session.input",
      sessionId,
      projectId:session.snapshot.projectId,
      agentId:session.snapshot.agentId,
      role:session.snapshot.role,
      provider:session.snapshot.provider,
      payload:{control:"constrain",message}
    });
    return true;
  }

  terminate(sessionId:string){
    const session=this.sessions.get(sessionId);
    if(!session)return false;
    if(!["running","starting"].includes(session.snapshot.status))return false;
    session.snapshot.status="stopping";
    session.snapshot.lastActivityAt=now();
    this.events.publish({
      type:"runtime.session.stopping",
      sessionId,
      projectId:session.snapshot.projectId,
      agentId:session.snapshot.agentId,
      role:session.snapshot.role,
      provider:session.snapshot.provider,
      payload:{pid:session.snapshot.pid}
    });
    try{session.process.kill();return true;}
    catch(error){
      session.snapshot.status="failed";
      const message=error instanceof Error?error.message:String(error);
      this.events.publish({
        type:"runtime.session.failed",
        sessionId,
        projectId:session.snapshot.projectId,
        agentId:session.snapshot.agentId,
        role:session.snapshot.role,
        provider:session.snapshot.provider,
        payload:{message}
      });
      throw error;
    }
  }

  terminateProject(projectId:string){
    let count=0;
    for(const session of this.sessions.values()){
      if(session.snapshot.projectId!==projectId)continue;
      if(this.terminate(session.snapshot.id))count++;
    }
    return count;
  }

  pruneExited(maxAgeMs=60*60*1000){
    const cutoff=Date.now()-maxAgeMs;
    let removed=0;
    for(const [id,session] of this.sessions){
      if(!["exited","failed"].includes(session.snapshot.status))continue;
      const at=Date.parse(session.snapshot.exitedAt||session.snapshot.lastActivityAt);
      if(Number.isFinite(at)&&at<cutoff){this.sessions.delete(id);removed++;}
    }
    return removed;
  }
}
