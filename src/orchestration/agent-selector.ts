export type AgentLike={id:string;name?:string;role?:string;capabilities?:string[]};

const CAPABILITY_ALIASES:Record<string,string[]>={
  testing:["testing","test","qa","quality","coverage","assert"],
  security:["security","secure","audit","auth","permission","vulnerability"],
  laravel:["laravel","php","eloquent","artisan"],
  backend:["backend","api","server","php","laravel","nest"],
  frontend:["frontend","react","next","ui","css"],
  database:["database","sql","postgres","mysql","prisma","eloquent"],
  devops:["devops","docker","deploy","ci","cd","nginx"],
  architecture:["architect","architecture","cto","director","design"]
};

function capabilityTerms(capabilityId:string){
  const raw=capabilityId.toLowerCase();
  const pieces=raw.split(/[._-]/).filter(x=>x.length>1);
  const terms=new Set<string>(pieces);
  terms.add(raw);

  for(const piece of pieces){
    for(const alias of CAPABILITY_ALIASES[piece]||[])terms.add(alias);
  }
  return [...terms];
}

export function selectAgentsForCapabilities(agents:AgentLike[],capabilityIds:string[]){
  const requested=capabilityIds.map(id=>({id:id.toLowerCase(),terms:capabilityTerms(id)}));

  const scored=agents.map((agent,index)=>{
    const hay=[agent.id,agent.name,agent.role,...(agent.capabilities||[])].filter(Boolean).join(" ").toLowerCase();
    const matchedCapabilities:string[]=[];
    let score=0;

    for(const req of requested){
      const matched=req.terms.some(term=>hay.includes(term));
      if(matched){
        matchedCapabilities.push(req.id);
        score+=10;
      }
    }

    if(/architect|cto|pm|director/.test(hay))score+=1;
    return {agent,score,matchedCapabilities,index};
  }).sort((a,b)=>b.score-a.score||a.index-b.index);

  // Coverage-first selection: ensure every requested capability gets a matching agent when possible.
  const selected:AgentLike[]=[];
  const selectedIds=new Set<string>();
  for(const req of requested){
    const best=scored.find(row=>row.matchedCapabilities.includes(req.id)&&!selectedIds.has(row.agent.id));
    if(best){
      selected.push(best.agent);
      selectedIds.add(best.agent.id);
    }
  }

  // Then add other relevant agents up to five.
  for(const row of scored){
    if(selected.length>=5)break;
    if(row.score<=0||selectedIds.has(row.agent.id))continue;
    selected.push(row.agent);
    selectedIds.add(row.agent.id);
  }

  if(!selected.length){
    const fallback=agents.filter(a=>/architect|developer|engineer|cto/i.test([a.id,a.name,a.role].join(" "))).slice(0,3);
    return fallback.length?fallback:agents.slice(0,3);
  }
  return selected;
}
