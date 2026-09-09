import type {SandboxProfile} from "./types";
export const SANDBOX_PROFILES:Record<string,SandboxProfile>={
 readonly:{id:"readonly",label:"Read Only",allowNetwork:false,allowShell:false,allowGitWrite:false,allowFileWrite:false,protectedPaths:[".env",".env.local",".git/","vendor/","node_modules/"],maxRuntimeMinutes:30,maxTokens:100000,maxCostUsd:5},
 guarded:{id:"guarded",label:"Guarded Development",allowNetwork:false,allowShell:true,allowGitWrite:true,allowFileWrite:true,protectedPaths:[".env",".env.local",".git/","vendor/","node_modules/","storage/framework/","bootstrap/cache/"],maxRuntimeMinutes:90,maxTokens:250000,maxCostUsd:25},
 connected:{id:"connected",label:"Connected Development",allowNetwork:true,allowShell:true,allowGitWrite:true,allowFileWrite:true,protectedPaths:[".env",".env.local",".git/","vendor/","node_modules/"],maxRuntimeMinutes:120,maxTokens:400000,maxCostUsd:50}
};
export function getSandboxProfile(id:string){return SANDBOX_PROFILES[id]||SANDBOX_PROFILES.guarded;}
