import type {ProviderHealth,ProviderId,ProviderRouteDecision,ProviderRouteInput} from "./types";
import {ProviderRegistry} from "./registry";

export class ProviderRouter{
  private registry=new ProviderRegistry();

  route(input:ProviderRouteInput,healthRows:ProviderHealth[]):ProviderRouteDecision{
    const health=new Map(healthRows.map(x=>[x.provider,x]));
    const excluded=new Set(input.excluded||[]);
    const text=`${input.task} ${input.role||""}`.toLowerCase();

    const ranked=this.registry.list()
      .filter(def=>!excluded.has(def.id))
      .filter(def=>!input.localOnly||def.capabilities.local)
      .map(def=>{
        const h=health.get(def.id);
        const reasons:string[]=[];
        let score=50;

        if(input.preferred===def.id){score+=35;reasons.push("preferred provider");}
        if(h?.status==="healthy"){score+=25;reasons.push("healthy");}
        else if(h?.status==="degraded"){score+=5;reasons.push("degraded");}
        else if(h?.status==="unavailable"){score-=100;reasons.push("unavailable");}

        if(/security|auth|permission|vulnerability|threat/.test(text)&&def.capabilities.security){score+=15;reasons.push("security capability");}
        if(/test|qa|verify|coverage/.test(text)&&def.capabilities.testing){score+=12;reasons.push("testing capability");}
        if(/plan|architecture|design|roadmap/.test(text)&&def.capabilities.planning){score+=10;reasons.push("planning capability");}
        if(/code|implement|fix|refactor|backend|frontend|api|laravel|react|typescript|php/.test(text)&&def.capabilities.coding){score+=12;reasons.push("coding capability");}
        if(input.localOnly&&def.capabilities.local){score+=30;reasons.push("local-only request");}
        if(def.capabilities.local){score+=4;reasons.push("local execution");}

        const latency=h?.latencyMs;
        if(typeof latency==="number"){
          if(latency<500){score+=8;reasons.push("low latency");}
          else if(latency>2500){score-=8;reasons.push("high latency");}
        }

        score-=def.cost.relativeCost*8;
        reasons.push(`cost weight ${def.cost.relativeCost.toFixed(2)}`);

        return {provider:def.id,score,reasons,health:h?.status||"unknown"};
      })
      .sort((a,b)=>b.score-a.score);

    const selected=ranked.find(x=>x.health!=="unavailable")?.provider||null;
    return {
      selected,
      ranked,
      reason:selected?`Selected ${selected} from capability, health, latency and relative cost signals.`:"No provider is currently available."
    };
  }

  failover(current:ProviderId,decision:ProviderRouteDecision){
    return decision.ranked.find(x=>x.provider!==current&&x.health!=="unavailable")?.provider||null;
  }
}
