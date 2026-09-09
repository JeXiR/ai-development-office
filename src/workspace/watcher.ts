import fs from "node:fs";
export type WorkspaceWatchEvent={projectId:string;event:"change"|"rename";relativePath:string;timestamp:string};
export class WorkspaceWatcher{
 private watchers=new Map<string,fs.FSWatcher>();
 watch(projectId:string,projectPath:string,onEvent:(e:WorkspaceWatchEvent)=>void){this.stop(projectId);try{const w=fs.watch(projectPath,{recursive:true},(type,file)=>{if(!file)return;const rel=String(file).replace(/\\/g,"/");if(rel.startsWith(".git/")||rel.includes("/node_modules/")||rel.startsWith("node_modules/"))return;onEvent({projectId,event:type==="rename"?"rename":"change",relativePath:rel,timestamp:new Date().toISOString()});});this.watchers.set(projectId,w);return true;}catch{return false;}}
 stop(projectId:string){this.watchers.get(projectId)?.close();this.watchers.delete(projectId);}
}
