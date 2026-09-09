import path from "node:path";
import os from "node:os";
import {AgentProviderPinStore} from "../src/provider-sdk/pinning";
import {ProviderPolicyStore,DEFAULT_PROVIDER_POLICY} from "../src/provider-sdk/policy";
import type {UniversalProviderId} from "../src/provider-sdk/types";
import {preferredUniversalProvider} from "../src/provider-sdk/eligibility";
import {getUniversalProviderRuntime} from "./provider-universal-runtime";

function dataDir(){
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA,"AI-Development-Office")
    : path.join(os.homedir(),".ai-development-office");
}

const pins=new AgentProviderPinStore(dataDir());
const policies=new ProviderPolicyStore(dataDir());

export function providerAssignmentSnapshot(){
  return {
    pins:pins.read(),
    policy:policies.read()
  };
}

export function setAgentProviderPin(data:any){
  const agentId=String(data?.agentId||"").trim();
  const providerId=String(data?.providerId||"auto") as UniversalProviderId|"auto";
  const model=data?.model?String(data.model):null;
  if(!agentId)throw new Error("agentId is required");
  pins.set({agentId,providerId,model});
  return providerAssignmentSnapshot();
}

export function removeAgentProviderPin(agentId:string){
  pins.remove(agentId);
  return providerAssignmentSnapshot();
}

export function saveProviderPolicy(data:any){
  const current=policies.read();
  const next={
    ...current,
    ...data,
    version:1,
    fallback:{...current.fallback,...(data?.fallback||{})},
    providerWeights:{...(data?.providerWeights||current.providerWeights||{})}
  };
  policies.write(next);
  return providerAssignmentSnapshot();
}

export async function routeWithPolicy(data:any){
  const policy=policies.read();
  const pin=data?.agentId?pins.get(String(data.agentId)):null;
  const preferredProvider=pin&&pin.providerId!=="auto"?pin.providerId:preferredUniversalProvider(data?.preferredProvider);
  return getUniversalProviderRuntime().route({
    requires:Array.isArray(data?.requires)?data.requires:[],
    preferredProvider,
    allowLocal:policy.fallback.allowLocal
  },policy);
}
