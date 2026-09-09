import fs from "node:fs";
import path from "node:path";
import {GovernanceStore} from "./store";

export type StableAcceptanceState={
  automatedTests:boolean;
  typecheck:boolean;
  productionBuild:boolean;
  windowsRuntime:boolean;
  callMeProject:boolean;
  securityRecovery:boolean;
  explicitUserApproval:boolean;
};

export class StableAcceptanceBinder{
  constructor(private readonly store=new GovernanceStore()){}

  file(projectPath:string){return path.join(projectPath,".ai-kit","governance","stable-acceptance.json");}

  read(projectPath:string):StableAcceptanceState{
    try{
      return {
        automatedTests:false,typecheck:false,productionBuild:false,windowsRuntime:false,
        callMeProject:false,securityRecovery:false,explicitUserApproval:false,
        ...JSON.parse(fs.readFileSync(this.file(projectPath),"utf8"))
      };
    }catch{
      return {
        automatedTests:false,typecheck:false,productionBuild:false,windowsRuntime:false,
        callMeProject:false,securityRecovery:false,explicitUserApproval:false
      };
    }
  }

  isUnlocked(projectPath:string){
    const s=this.read(projectPath);
    return Object.values(s).every(Boolean);
  }

  evidenceIds(projectId:string,projectPath:string){
    const s=this.read(projectPath);
    const rows=this.store.evidence(projectPath);
    const required=[
      ["automatedTests","automated regression"],
      ["typecheck","typecheck"],
      ["productionBuild","production build"],
      ["windowsRuntime","windows runtime"],
      ["callMeProject","callme real project"],
      ["securityRecovery","security recovery"]
    ] as const;
    return required.flatMap(([key,label])=>{
      if(!s[key])return [];
      const row=rows.find(x=>x.label.toLowerCase().includes(label));
      return row?[row.id]:[];
    });
  }
}
