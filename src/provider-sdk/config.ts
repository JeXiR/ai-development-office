import type {ProviderManifest,UniversalProviderId} from "./types";

export type ProviderConfig={
  id:UniversalProviderId;
  enabled:boolean;
  endpoint:string|null;
  model:string|null;
};

export function providerConfigured(manifest:ProviderManifest){
  if(manifest.id==="ollama")return Boolean(String(process.env.OLLAMA_MODEL||"").trim());
  if(manifest.transport==="cli")return true;
  if(manifest.transport==="local-http")return true;
  if(manifest.credentialEnv&&process.env[manifest.credentialEnv])return true;
  if(manifest.id==="openai-compatible"&&process.env.OPENAI_COMPATIBLE_BASE_URL)return true;
  return false;
}

export function providerEndpoint(manifest:ProviderManifest){
  if(manifest.endpointEnv&&process.env[manifest.endpointEnv])return String(process.env[manifest.endpointEnv]);
  if(manifest.id==="ollama")return "http://127.0.0.1:11434";
  if(manifest.id==="openai-compatible")return process.env.OPENAI_COMPATIBLE_BASE_URL||null;
  return null;
}

export function maskedCredentialState(manifest:ProviderManifest){
  if(!manifest.credentialEnv)return {required:false,present:true,env:null};
  return {
    required:true,
    present:Boolean(process.env[manifest.credentialEnv]),
    env:manifest.credentialEnv
  };
}
