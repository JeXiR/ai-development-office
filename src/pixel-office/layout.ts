export type DeskAssignment={agentId:string;stationId:string;slot:number;};

const roleStationRules:Array<[RegExp,string]>= [
  [/director|ceo|cto|architect|pm/i,"director"],
  [/qa|test/i,"qa"],
  [/security/i,"security"],
  [/database|postgres|mysql/i,"database"],
  [/devops|docker|deploy|ci/i,"devops"],
  [/docs/i,"memory"],
  [/frontend|backend|laravel|flutter|engineer|specialist/i,"editor"]
];

export function stationForRole(role:string){
  return roleStationRules.find(([re])=>re.test(role))?.[1]||"lounge";
}

export function assignDesks(agents:Array<{id:string;role:string}>):DeskAssignment[]{
  const counts=new Map<string,number>();
  return agents.map(agent=>{
    const stationId=stationForRole(agent.role);
    const slot=counts.get(stationId)||0;
    counts.set(stationId,slot+1);
    return {agentId:agent.id,stationId,slot};
  });
}

export function slotOffset(slot:number){
  const cols=3;
  return {x:(slot%cols)*30,y:Math.floor(slot/cols)*34};
}
