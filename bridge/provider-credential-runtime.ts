import os from "node:os";
import path from "node:path";
import {BUILTIN_PROVIDER_MANIFESTS} from "../src/provider-sdk/manifests";
import {SecureProviderCredentialStore} from "../src/provider-sdk/credentials";
import {providerCredentialStatus,providerSecretEnvName} from "../src/provider-sdk/credential-resolver";
import type {UniversalProviderId} from "../src/provider-sdk/types";

function dataDir(){
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA,"AI-Development-Office")
    : path.join(os.homedir(),".ai-development-office");
}

const store=new SecureProviderCredentialStore(dataDir());

export function credentialSnapshot(){
  return BUILTIN_PROVIDER_MANIFESTS.map(manifest=>({
    ...providerCredentialStatus(manifest,store),
    providerId:manifest.id,
    providerName:manifest.name,
    envName:manifest.credentialEnv||providerSecretEnvName(manifest.id)
  }));
}

export function saveProviderCredential(data:any){
  const providerId=String(data?.providerId||"") as UniversalProviderId;
  const value=String(data?.value||"");
  if(!BUILTIN_PROVIDER_MANIFESTS.some(x=>x.id===providerId))throw new Error("Unknown provider.");
  store.set(providerId,value);
  return credentialSnapshot();
}

export function deleteProviderCredential(providerId:string){
  store.remove(providerId as UniversalProviderId);
  return credentialSnapshot();
}

export function applySecureCredentialsToProcess(){
  for(const manifest of BUILTIN_PROVIDER_MANIFESTS){
    if(!manifest.credentialEnv)continue;
    const value=store.get(manifest.id);
    if(value&&!process.env[manifest.credentialEnv])process.env[manifest.credentialEnv]=value;
  }
}

export function secureCredentialStore(){return store;}
