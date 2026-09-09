import type {DirectorTask} from "./types";

export class DependencyRouter{
  ready(tasks:DirectorTask[]){
    const byId=new Map(tasks.map(t=>[t.id,t]));
    return tasks.filter(task=>{
      if(!["planned","queued","blocked"].includes(task.status))return false;
      return task.dependencies.every(dep=>{
        const found=byId.get(dep);
        return !found||found.status==="done";
      });
    });
  }

  blocked(tasks:DirectorTask[]){
    const byId=new Map(tasks.map(t=>[t.id,t]));
    return tasks.filter(task=>task.dependencies.some(dep=>{
      const found=byId.get(dep);
      return found&&found.status==="failed";
    }));
  }
}
