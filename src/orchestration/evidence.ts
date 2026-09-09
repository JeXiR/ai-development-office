import fs from "node:fs";
import path from "node:path";

export type MissionEvidenceBundle={
  missionId:string;
  createdAt:string;
  goal:string;
  projectId:string;
  projectPath:string;
  kitCapabilities:string[];
  assignments:unknown[];
  providerAttempts:unknown[];
  testStage:unknown;
  reviewStage:unknown;
  approval:unknown|null;
  finalResult:unknown;
};

export class MissionEvidenceStore{
  constructor(private readonly dataDir:string){}
  private dir(){return path.join(this.dataDir,"mission-evidence");}
  private file(missionId:string){return path.join(this.dir(),`${missionId}.json`);}

  write(bundle:MissionEvidenceBundle){
    fs.mkdirSync(this.dir(),{recursive:true});
    fs.writeFileSync(this.file(bundle.missionId),JSON.stringify(bundle,null,2)+"\n","utf8");
    return this.file(bundle.missionId);
  }

  read(missionId:string){
    try{return JSON.parse(fs.readFileSync(this.file(missionId),"utf8"));}catch{return null;}
  }

  list(limit=100){
    try{
      return fs.readdirSync(this.dir()).filter(x=>x.endsWith(".json")).slice(-limit).map(name=>{
        const full=path.join(this.dir(),name);
        const data=JSON.parse(fs.readFileSync(full,"utf8"));
        return {missionId:data.missionId,createdAt:data.createdAt,goal:data.goal,projectId:data.projectId,status:data.finalResult?.status||null};
      });
    }catch{return [];}
  }
}
