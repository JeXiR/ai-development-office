import fs from "node:fs";
import path from "node:path";

export type RestoredProject={
  id:string;
  name:string;
  path:string;
};

export function restoreLastProject(dataDir:string,explicitPath?:string|null):RestoredProject|null{
  if(explicitPath){
    return {id:"env-project",name:path.basename(explicitPath),path:explicitPath};
  }

  try{
    const file=path.join(dataDir,"projects.json");
    const parsed=JSON.parse(fs.readFileSync(file,"utf8"));
    const rows=Array.isArray(parsed)?parsed:Array.isArray(parsed?.projects)?parsed.projects:[];
    const current=parsed?.activeProjectId||parsed?.lastProjectId||null;
    const found=(current?rows.find((x:any)=>x.id===current):rows[0])||null;
    if(!found?.path)return null;
    return {id:String(found.id||"project"),name:String(found.name||path.basename(found.path)),path:String(found.path)};
  }catch{return null;}
}
