import {CollaborationStore} from "./store";
import {OfficeDirector} from "./director";
import {DependencyRouter} from "./dependency-router";

export class CollaborationService{
  readonly store=new CollaborationStore();
  readonly director=new OfficeDirector();
  readonly router=new DependencyRouter();

  createPlan(projectId:string,projectPath:string,goal:string,availableRoles:string[]){
    const raw=this.director.decompose({goal,projectId,availableRoles});
    const plan=this.store.createPlan(projectId,projectPath,goal,raw);
    // Resolve @task:n dependencies to actual generated task IDs.
    for(const [index,task] of plan.tasks.entries()){
      const dependencies=task.dependencies.map(dep=>{
        const m=/^@task:(\d+)$/.exec(dep);
        return m?plan.tasks[Number(m[1])]?.id||dep:dep;
      });
      this.store.updateTask(projectId,projectPath,task.id,{dependencies});
      plan.tasks[index].dependencies=dependencies;
    }
    return plan;
  }

  snapshot(projectId:string,projectPath:string){
    const data=this.store.snapshot(projectId,projectPath);
    return {
      ...data,
      readyTasks:this.router.ready(data.tasks),
      blockedTasks:this.router.blocked(data.tasks)
    };
  }
}
