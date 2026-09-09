import type {ProviderId,ProviderRouteInput} from "./types";
import {ProviderRegistry} from "./registry";
import {ProviderResolver} from "./resolver";
import {ProviderHealthMonitor} from "./health";
import {ProviderRouter} from "./router";
import {ProviderSessionFactory} from "./session";

export class ProviderEngine{
  readonly registry=new ProviderRegistry();
  readonly resolver=new ProviderResolver();
  readonly health=new ProviderHealthMonitor();
  readonly router=new ProviderRouter();
  readonly sessions=new ProviderSessionFactory();

  route(input:ProviderRouteInput){
    const health=this.health.checkAll();
    return this.router.route(input,health);
  }

  buildLaunch(provider:ProviderId,projectPath:string,resumeToken?:string|null){
    const def=this.registry.get(provider);
    if(!def)throw new Error(`Unknown provider: ${provider}`);
    const executable=this.resolver.resolveExecutable(provider);
    if(!executable)throw new Error(`${provider} executable not found.`);
    return this.sessions.build(def,executable,projectPath,resumeToken);
  }

  failover(current:ProviderId,input:ProviderRouteInput){
    const decision=this.route({...input,excluded:[...(input.excluded||[]),current]});
    return decision.selected;
  }
}
