import type {AgentQualityScore,RoutingBudget} from "./types";
import type {ProviderHealth,ProviderId} from "@/providers/types";
import {ProviderRegistry} from "@/providers/registry";

const registry=new ProviderRegistry();

function costRank(provider:ProviderId){
  return registry.get(provider)?.cost.relativeCost??5;
}

export class AutonomousRouter{
  choose(input:{
    task:string;
    role:string;
    providers:ProviderHealth[];
    scores:AgentQualityScore[];
    budget:RoutingBudget;
  }){
    const task=input.task.toLowerCase();
    const capable=input.providers.filter(p=>p.status!=="unavailable"&&!input.budget.avoidProviders.includes(p.provider));
    if(!capable.length)return {selected:null,reason:"No healthy provider available.",candidates:[] as Array<{provider:ProviderId;score:number;latencyMs:number|null;costRank:number}>};

    const preferred=new Set(input.budget.preferredProviders);
    const rows=capable.map(p=>{
      let score=50;
      if(preferred.has(p.provider))score+=15;
      if(/architecture|review|security/.test(task)&&p.provider==="claude")score+=12;
      if(/implement|code|test|fix/.test(task)&&p.provider==="codex")score+=12;
      if(/interactive|editor|cursor/.test(task)&&p.provider==="cursor")score+=8;
      if(typeof p.latencyMs==="number")score-=Math.min(15,p.latencyMs/200);
      score-=costRank(p.provider)*3;

      const agents=input.scores.filter(x=>x.role.toLowerCase()===input.role.toLowerCase()&&x.trust>=input.budget.minTrust);
      if(agents.length)score+=Math.max(...agents.map(x=>x.trust))/20;

      if(input.budget.maxCostUsd!==null&&costRank(p.provider)>1.1)score-=8;

      return {
        provider:p.provider,
        score:Number(score.toFixed(2)),
        latencyMs:p.latencyMs,
        costRank:costRank(p.provider)
      };
    }).sort((a,b)=>b.score-a.score);

    return {
      selected:rows[0]?.provider||null,
      reason:rows.length?"Best task/budget/trust score.":"No candidate.",
      candidates:rows
    };
  }
}
