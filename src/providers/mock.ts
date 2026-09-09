import type {ProviderHealth,ProviderId,ProviderRouteInput} from "./types";
import {ProviderRouter} from "./router";

export class MockProviderEnvironment{
  private health=new Map<ProviderId,ProviderHealth>();

  set(provider:ProviderId,status:ProviderHealth["status"],latencyMs:number|null=100){
    this.health.set(provider,{
      provider,status,latencyMs,checkedAt:new Date().toISOString(),
      executable:status==="unavailable"?null:`mock-${provider}`,
      message:`mock ${status}`
    });
    return this;
  }

  route(input:ProviderRouteInput){
    const router=new ProviderRouter();
    return router.route(input,[...this.health.values()]);
  }
}
