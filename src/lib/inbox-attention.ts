import type {OfficeCommandRequest} from "@/types/command";

export function needsInboxAttention(command:OfficeCommandRequest){
  if((command as OfficeCommandRequest & {inboxDismissed?:boolean}).inboxDismissed)return false;
  if((command.ownershipConflicts?.length??0)>0)return true;
  const finished=["completed","cancelled","failed"].includes(command.status);
  if((command.blockedBy?.length??0)>0&&!finished)return true;
  const solo=(command.executionMode||"solo")==="solo";
  if(command.mergeGateStatus==="blocked"&&!solo&&!finished)return true;
  if(command.driftStatus==="detected"&&!finished)return true;
  if((command.verifierStatus==="failed"||command.verifierStatus==="error")&&!finished)return true;
  return false;
}

export function historyForClient<T extends {id:string}>(
  history:T[],
  recentLimit=100,
  maxTotal=250
){
  const recent=history.slice(0,recentLimit);
  const extras=history.slice(recentLimit).filter(item=>needsInboxAttention(item as OfficeCommandRequest));
  const seen=new Set(recent.map(item=>item.id));
  const merged=[...recent];
  for(const item of extras){
    if(seen.has(item.id))continue;
    merged.push(item);
    if(merged.length>=maxTotal)break;
  }
  return merged;
}

export function inboxAttentionCount(input:{
  projectId:string|null;
  history:OfficeCommandRequest[];
  openQuestions?:number;
  interrupted?:Array<{projectId?:string;status?:string}>;
}){
  if(!input.projectId)return 0;
  const blocked=input.history.filter(c=>c.projectId===input.projectId&&needsInboxAttention(c)).length;
  const recovery=(input.interrupted||[]).filter(x=>x.projectId===input.projectId&&["queued","waiting_for_agent","planning","plan_ready","running","verifying"].includes(String(x.status||""))).length;
  return blocked+(input.openQuestions||0)+recovery;
}
