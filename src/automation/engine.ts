import type {ScheduledMission} from "./types";
import {AutomationStore} from "./store";

export type MissionExecutor=(mission:ScheduledMission)=>Promise<{ok:boolean;result:string}>;

export class AutomationEngine{
  readonly store=new AutomationStore();

  async runDue(projectId:string,projectPath:string,executor:MissionExecutor){
    const due=this.store.due(projectPath);
    const results:Array<{missionId:string;ok:boolean;result:string}>=[];
    for(const mission of due){
      this.store.updateMission(projectPath,mission.id,{
        status:"running",
        lastRunAt:new Date().toISOString()
      });

      try{
        const result=await executor(mission);
        results.push({missionId:mission.id,...result});
        if(result.ok){
          this.store.updateMission(projectPath,mission.id,{retryCount:0,lastResult:result.result});
          this.store.scheduleNext(projectPath,mission.id);
        }else{
          const retries=mission.retryCount+1;
          if(retries<=mission.maxRetries){
            this.store.updateMission(projectPath,mission.id,{
              retryCount:retries,
              status:"scheduled",
              nextRunAt:new Date(Date.now()+Math.min(60,retries*5)*60000).toISOString(),
              lastResult:result.result
            });
          }else{
            this.store.updateMission(projectPath,mission.id,{
              retryCount:retries,
              status:"failed",
              enabled:false,
              lastResult:result.result
            });
          }
        }
      }catch(error){
        const retries=mission.retryCount+1;
        const message=error instanceof Error?error.message:String(error);
        results.push({missionId:mission.id,ok:false,result:message});
        this.store.updateMission(projectPath,mission.id,{
          retryCount:retries,
          status:retries<=mission.maxRetries?"scheduled":"failed",
          enabled:retries<=mission.maxRetries,
          nextRunAt:new Date(Date.now()+Math.min(60,retries*5)*60000).toISOString(),
          lastResult:message
        });
      }
    }
    return results;
  }
}
