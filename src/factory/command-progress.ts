export function normalizeAgentKey(value:string){
  return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}

export function commandMatchesAgent(command:any, agent:{id?:string|null;role?:string|null}){
  const lane=normalizeAgentKey(command?.executionLane||command?.assignedRole||command?.assignedAgentId||command?.leadRole||"");
  const id=normalizeAgentKey(agent.id||"");
  const role=normalizeAgentKey(agent.role||"");
  return Boolean(lane&&(lane===id||lane===role));
}

export function commandStageProgress(status:string, startedAt?:string|null, updatedAt?:string|null){
  const key=String(status||"").toLowerCase();
  const start=Date.parse(String(startedAt||updatedAt||""));
  const elapsed=Number.isFinite(start)?Math.max(0,(Date.now()-start)/60000):0;
  if(key==="completed")return 100;
  if(key==="failed"||key==="cancelled")return null;
  if(key==="queued"||key==="waiting_for_agent")return 8;
  if(key==="planning"||key==="plan_ready")return 20;
  if(key==="running")return Math.min(78, 28+Math.floor(elapsed*2.5));
  if(key==="verifying")return 88;
  return null;
}

export function sprintProgressPercent(commands:Array<{status?:string;startedAt?:string|null;updatedAt?:string|null}>){
  if(!commands.length)return {percent:null as number|null,total:0,completed:0,queueCount:0};
  let weight=0;
  let completed=0;
  let queued=0;
  for(const command of commands){
    const status=String(command.status||"");
    if(status==="completed"){
      weight+=1;
      completed+=1;
      continue;
    }
    if(status==="failed"||status==="cancelled")continue;
    const stage=commandStageProgress(status,command.startedAt,command.updatedAt);
    weight+=stage==null?0:stage/100;
    if(status==="queued"||status==="waiting_for_agent")queued+=1;
  }
  return {
    percent:Math.round(weight/commands.length*100),
    total:commands.length,
    completed,
    queueCount:queued
  };
}
