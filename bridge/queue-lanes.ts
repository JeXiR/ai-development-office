export const READ_ONLY_COMMANDS=new Set([
  "status","review project","project coverage","validate","refresh backlog",
  "recheck completed work","sync state","sync docs","discover project"
]);

export const MUTATING_COMMANDS=new Set([
  "fix next","continue","fix finding","execute work item"
]);

export function normalizeLane(value:string|null|undefined){
  return String(value||"general").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"general";
}

export function isReadOnlyCommand(command:string){
  return READ_ONLY_COMMANDS.has(String(command||"").trim().toLowerCase());
}

export function isMutatingCommand(command:string){
  return MUTATING_COMMANDS.has(String(command||"").trim().toLowerCase());
}

export function laneFor(item:{executionLane?:string|null;assignedRole?:string|null;command:string}){
  if(item.executionLane)return normalizeLane(item.executionLane);
  if(item.assignedRole)return normalizeLane(item.assignedRole);
  const command=String(item.command||"").trim().toLowerCase();
  if(isReadOnlyCommand(command))return `read-${normalizeLane(command)}`;
  return normalizeLane(command);
}

export function pickQueueItems<T extends {command:string;queueSequence?:number;createdAt:string}>(
  candidates:T[],
  activeLanes:Iterable<string>,
  capacity:number,
  laneOf:(item:T)=>string
){
  if(capacity<=0)return [] as T[];
  const reserved=new Set(activeLanes);
  const mutatingWaiting=candidates.some(item=>isMutatingCommand(item.command));
  const mutatingActive=[...reserved].some(lane=>!lane.startsWith("read-"));
  const selected:T[]=[];

  const sorted=[...candidates].sort((a,b)=>{
    const am=isMutatingCommand(a.command)?0:1;
    const bm=isMutatingCommand(b.command)?0:1;
    if(am!==bm)return am-bm;
    return (a.queueSequence||0)-(b.queueSequence||0)||a.createdAt.localeCompare(b.createdAt);
  });

  for(const item of sorted){
    if(selected.length>=capacity)break;
    const lane=laneOf(item);
    if(reserved.has(lane))continue;
    const mutating=isMutatingCommand(item.command);
    if(!mutating&&mutatingWaiting&&!mutatingActive&&!selected.some(x=>isMutatingCommand(x.command))){
      if(selected.length>=capacity-1)continue;
    }
    reserved.add(lane);
    selected.push(item);
  }
  return selected;
}
