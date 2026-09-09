import crypto from "node:crypto";

export function deterministicId(namespace:string,...parts:Array<string|number|null|undefined>){
  const body=[namespace,...parts.map(x=>String(x??""))].join("\x1f");
  return crypto.createHash("sha256").update(body).digest("hex").slice(0,24);
}

export function deterministicTaskId(projectId:string,planId:string,role:string,index:number,title:string){
  return `task-${deterministicId("task",projectId,planId,role,index,title)}`;
}
