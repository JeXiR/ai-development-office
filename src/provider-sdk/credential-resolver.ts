import type {ProviderManifest,UniversalProviderId} from "./types";
import {SecureProviderCredentialStore} from "./credentials";

export function resolveProviderSecret(
  manifest:ProviderManifest,
  secureStore?:SecureProviderCredentialStore
){
  if(secureStore?.has(manifest.id))return secureStore.get(manifest.id);
  if(manifest.credentialEnv&&process.env[manifest.credentialEnv])return String(process.env[manifest.credentialEnv]);
  return null;
}

export function providerCredentialStatus(
  manifest:ProviderManifest,
  secureStore?:SecureProviderCredentialStore
){
  if(secureStore?.has(manifest.id)){
    return {
      providerId:manifest.id,
      present:true,
      source:"secure-store" as const,
      storageMode:secureStore.mode(manifest.id),
      updatedAt:secureStore.updatedAt(manifest.id)
    };
  }
  if(manifest.credentialEnv&&process.env[manifest.credentialEnv]){
    return {
      providerId:manifest.id,
      present:true,
      source:"environment" as const,
      storageMode:"environment",
      updatedAt:null
    };
  }
  return {
    providerId:manifest.id,
    present:false,
    source:"none" as const,
    storageMode:"none",
    updatedAt:null
  };
}

export function providerSecretEnvName(id:UniversalProviderId){
  const map:Partial<Record<UniversalProviderId,string>>={
    openai:"OPENAI_API_KEY",
    anthropic:"ANTHROPIC_API_KEY",
    gemini:"GEMINI_API_KEY",
    xai:"XAI_API_KEY",
    groq:"GROQ_API_KEY",
    "openai-compatible":"OPENAI_COMPATIBLE_API_KEY"
  };
  return map[id]||null;
}
