import type {DirectorTask} from "./types";

type DecompositionInput={
  goal:string;
  projectId:string;
  availableRoles:string[];
};

function detectRoles(goal:string,available:string[]){
  const text=goal.toLowerCase();
  const wanted:string[]=[];
  const add=(role:string)=>{if(available.includes(role)&&!wanted.includes(role))wanted.push(role);};

  if(/architect|architecture|design|schema|system/.test(text))add("architect");
  if(/backend|api|laravel|php|database|sql|server/.test(text)){add("backend");add("database");}
  if(/frontend|react|ui|ux|css|blade|inertia/.test(text))add("frontend");
  if(/security|auth|permission|role|vulnerability/.test(text))add("security");
  if(/test|qa|verify|coverage/.test(text))add("qa");
  if(/deploy|docker|ci|cd|server|nginx|plesk/.test(text))add("devops");

  if(!wanted.length){
    for(const fallback of ["architect","backend","frontend","qa"]){
      if(available.includes(fallback)){wanted.push(fallback);if(wanted.length>=3)break;}
    }
  }
  if(available.includes("qa")&&!wanted.includes("qa"))wanted.push("qa");
  return wanted;
}

export class OfficeDirector{
  decompose(input:DecompositionInput){
    const roles=detectRoles(input.goal,input.availableRoles);
    const tasks:Array<Omit<DirectorTask,"id"|"projectId"|"createdAt"|"updatedAt"|"status">>=[];
    let previous:string|null=null;

    for(const role of roles){
      const token=`pending-${tasks.length+1}`;
      const isQa=role==="qa";
      tasks.push({
        title:isQa?`Verify: ${input.goal}`:`${role}: ${input.goal}`,
        description:isQa
          ?"Verify implementation, run relevant tests and report regressions."
          :`Implement the ${role} portion of the goal and produce a structured handoff.`,
        assignedRole:role,
        assignedAgentId:null,
        dependencies:previous?[previous]:[],
        acceptanceCriteria:isQa
          ?["Relevant tests executed","No blocker regression introduced","Verification evidence recorded"]
          :["Implementation complete","Changed files identified","Handoff artifact produced"],
        artifacts:[]
      });
      previous=token;
    }

    // Replace temporary dependency tokens with stable task-local references.
    return tasks.map((task,index)=>({
      ...task,
      dependencies:task.dependencies.map(dep=>{
        const match=/pending-(\d+)/.exec(dep);
        return match?`@task:${Number(match[1])-1}`:dep;
      })
    }));
  }
}
