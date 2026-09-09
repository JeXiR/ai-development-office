import {getUniversalProviderRuntime} from "./provider-universal-runtime";
import type {UniversalProviderId} from "../src/provider-sdk/types";

export async function testProviderConnection(providerId:string){
  const runtime=getUniversalProviderRuntime();
  const state=await runtime.state();
  const row=state.find(x=>x.id===providerId as UniversalProviderId);
  if(!row)throw new Error("Unknown provider.");
  return {
    providerId:row.id,
    configured:row.configured,
    detected:row.detected,
    health:row.health,
    models:row.models.slice(0,25),
    lastError:row.lastError
  };
}
