import type {MemoryV2Record} from "./types";

export function inferSpecialties(records:MemoryV2Record[],agentId:string){
  const weights=new Map<string,number>();
  for(const row of records){
    if(row.agentId!==agentId&&row.scope!=="shared")continue;
    for(const tag of row.tags){
      weights.set(tag,(weights.get(tag)||0)+row.importance*row.confidence*(row.category==="lesson"||row.category==="specialization"?1.5:1));
    }
  }
  return [...weights.entries()]
    .sort((a,b)=>b[1]-a[1])
    .slice(0,8)
    .map(([tag,score])=>({tag,score:Number(score.toFixed(3))}));
}
