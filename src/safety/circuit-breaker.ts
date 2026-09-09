import crypto from "node:crypto";
import type {SafetyAction,SafetyIncident,SafetyPolicy,SafetyReason,SafetySessionState} from "./types";

const defaultPolicy:SafetyPolicy={
  repeatedErrorThreshold:3,
  repeatedCommandThreshold:4,
  noProgressThreshold:5,
  maxRuntimeMinutes:90,
  maxTokens:250000,
  maxCostUsd:25,
  protectedPaths:[
    ".env",
    ".env.local",
    ".git/",
    "vendor/",
    "node_modules/",
    "storage/framework/",
    "bootstrap/cache/"
  ]
};

function now(){return new Date().toISOString();}

export class CircuitBreaker{
  readonly policy:SafetyPolicy;
  private sessions=new Map<string,SafetySessionState>();

  constructor(policy?:Partial<SafetyPolicy>){
    this.policy={...defaultPolicy,...policy};
  }

  state(sessionId:string,seed?:Pick<SafetySessionState,"projectId"|"agentId">){
    let row=this.sessions.get(sessionId);
    if(!row){
      if(!seed)throw new Error("Safety session not initialized.");
      row={
        sessionId,
        projectId:seed.projectId,
        agentId:seed.agentId,
        paused:false,
        constrained:false,
        stopped:false,
        lastCommands:[],
        lastErrors:[],
        lastProgressSignatures:[],
        startedAt:now(),
        tokens:0,
        costUsd:0
      };
      this.sessions.set(sessionId,row);
    }
    return row;
  }

  remove(sessionId:string){this.sessions.delete(sessionId);}

  recordCommand(sessionId:string,seed:Pick<SafetySessionState,"projectId"|"agentId">,command:string){
    const s=this.state(sessionId,seed);
    s.lastCommands.push(command.trim());
    s.lastCommands=s.lastCommands.slice(-this.policy.repeatedCommandThreshold);
    if(s.lastCommands.length>=this.policy.repeatedCommandThreshold && new Set(s.lastCommands).size===1){
      return this.incident(s,"repeated-command","constrain",`Same command repeated ${s.lastCommands.length} times.`,{command});
    }
    return null;
  }

  recordError(sessionId:string,seed:Pick<SafetySessionState,"projectId"|"agentId">,error:string){
    const s=this.state(sessionId,seed);
    s.lastErrors.push(error.trim());
    s.lastErrors=s.lastErrors.slice(-this.policy.repeatedErrorThreshold);
    if(s.lastErrors.length>=this.policy.repeatedErrorThreshold && new Set(s.lastErrors).size===1){
      return this.incident(s,"repeated-error","pause",`Same error repeated ${s.lastErrors.length} times.`,{error});
    }
    return null;
  }

  recordProgress(sessionId:string,seed:Pick<SafetySessionState,"projectId"|"agentId">,signature:string){
    const s=this.state(sessionId,seed);
    s.lastProgressSignatures.push(signature);
    s.lastProgressSignatures=s.lastProgressSignatures.slice(-this.policy.noProgressThreshold);
    if(s.lastProgressSignatures.length>=this.policy.noProgressThreshold && new Set(s.lastProgressSignatures).size===1){
      return this.incident(s,"no-progress","pause","No meaningful progress detected.",{signature});
    }
    return null;
  }

  recordUsage(sessionId:string,seed:Pick<SafetySessionState,"projectId"|"agentId">,tokens:number,costUsd:number){
    const s=this.state(sessionId,seed);
    s.tokens=Math.max(s.tokens,tokens);
    s.costUsd=Math.max(s.costUsd,costUsd);
    if(s.tokens>=this.policy.maxTokens){
      return this.incident(s,"token-ceiling","stop",`Token ceiling exceeded: ${s.tokens}.`,{tokens:s.tokens});
    }
    if(s.costUsd>=this.policy.maxCostUsd){
      return this.incident(s,"cost-ceiling","stop",`Cost ceiling exceeded: $${s.costUsd.toFixed(2)}.`,{costUsd:s.costUsd});
    }
    return null;
  }

  checkRuntime(sessionId:string,seed:Pick<SafetySessionState,"projectId"|"agentId">){
    const s=this.state(sessionId,seed);
    const minutes=(Date.now()-Date.parse(s.startedAt))/60000;
    if(minutes>=this.policy.maxRuntimeMinutes){
      return this.incident(s,"time-ceiling","stop",`Runtime ceiling exceeded: ${Math.floor(minutes)} minutes.`,{minutes});
    }
    return null;
  }

  checkProtectedPath(sessionId:string,seed:Pick<SafetySessionState,"projectId"|"agentId">,relativePath:string){
    const normalized=relativePath.replace(/\\/g,"/").replace(/^\.?\//,"");
    const hit=this.policy.protectedPaths.find(p=>normalized===p.replace(/\/$/,"")||normalized.startsWith(p));
    if(hit){
      return this.incident(this.state(sessionId,seed),"protected-path","pause",`Protected path access blocked: ${relativePath}.`,{relativePath,rule:hit});
    }
    return null;
  }

  pause(sessionId:string,seed:Pick<SafetySessionState,"projectId"|"agentId">,message="Paused manually."){
    const s=this.state(sessionId,seed);
    s.paused=true;
    return this.incident(s,"manual","pause",message,{});
  }

  resume(sessionId:string){
    const s=this.state(sessionId);
    s.paused=false;
    s.constrained=false;
    return s;
  }

  constrain(sessionId:string,seed:Pick<SafetySessionState,"projectId"|"agentId">,message="Constrained manually."){
    const s=this.state(sessionId,seed);
    s.constrained=true;
    return this.incident(s,"manual","constrain",message,{});
  }

  stop(sessionId:string,seed:Pick<SafetySessionState,"projectId"|"agentId">,message="Stopped manually."){
    const s=this.state(sessionId,seed);
    s.stopped=true;
    return this.incident(s,"manual","stop",message,{});
  }

  private incident(s:SafetySessionState,reason:SafetyReason,action:SafetyAction,message:string,metadata:Record<string,unknown>):SafetyIncident{
    if(action==="pause")s.paused=true;
    if(action==="constrain")s.constrained=true;
    if(action==="stop")s.stopped=true;
    return {
      id:crypto.randomUUID(),
      projectId:s.projectId,
      sessionId:s.sessionId,
      agentId:s.agentId,
      reason,
      action,
      message,
      createdAt:now(),
      metadata
    };
  }
}
