import crypto from "node:crypto";
import type {DynamicTeam,TeamRole} from "./types";

const templates:Array<{match:RegExp;role:TeamRole}>= [
  {match:/frontend|react|ui|ux/i,role:{id:"frontend",title:"Frontend Engineer",capabilities:["frontend","react","typescript","ui"],preferredProviders:["codex","claude"],maxCostUsd:null}},
  {match:/backend|api|laravel|nestjs/i,role:{id:"backend",title:"Backend Engineer",capabilities:["backend","api","database"],preferredProviders:["codex","claude"],maxCostUsd:null}},
  {match:/security|auth|permission/i,role:{id:"security",title:"Security Engineer",capabilities:["security","auth","review"],preferredProviders:["claude","codex"],maxCostUsd:null}},
  {match:/test|qa|regression/i,role:{id:"qa",title:"QA Engineer",capabilities:["testing","review","automation"],preferredProviders:["codex","claude"],maxCostUsd:null}},
  {match:/database|sql|postgres|mysql/i,role:{id:"database",title:"Database Engineer",capabilities:["database","sql","migration"],preferredProviders:["codex","claude"],maxCostUsd:null}},
  {match:/devops|docker|deploy|ci/i,role:{id:"devops",title:"DevOps Engineer",capabilities:["devops","docker","ci","deployment"],preferredProviders:["claude","codex"],maxCostUsd:null}}
];

export class DynamicTeamBuilder{
  create(projectId:string,goal:string):DynamicTeam{
    const roles:TeamRole[]=[];
    for(const item of templates){
      if(item.match.test(goal)&&!roles.some(x=>x.id===item.role.id))roles.push({...item.role,capabilities:[...item.role.capabilities],preferredProviders:[...item.role.preferredProviders]});
    }
    if(!roles.length){
      roles.push({id:"general",title:"Generalist Engineer",capabilities:["implementation","review"],preferredProviders:["codex","claude","cursor"],maxCostUsd:null});
    }
    if(roles.length>1&&!roles.some(x=>x.id==="architect")){
      roles.unshift({id:"architect",title:"Solution Architect",capabilities:["architecture","coordination","review"],preferredProviders:["claude","codex"],maxCostUsd:null});
    }
    return {id:crypto.randomUUID(),projectId,goal,roles,createdAt:new Date().toISOString()};
  }
}
