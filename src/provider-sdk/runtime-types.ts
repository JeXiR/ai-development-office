import type {ProviderHealth,ProviderManifest,UniversalProviderId} from "./types";

export type ProviderRuntimeState={
  id:UniversalProviderId;
  manifest:ProviderManifest;
  configured:boolean;
  detected:boolean;
  health:ProviderHealth|null;
  models:string[];
  lastError:string|null;
};

export type ProviderRouteRequest={
  taskType?:string;
  requires?:Array<keyof ProviderManifest["capabilities"]>;
  preferredProvider?:UniversalProviderId|null;
  excludedProviders?:UniversalProviderId[];
  allowLocal?:boolean;
};

export type ProviderRouteDecision={
  providerId:UniversalProviderId|null;
  score:number;
  reasons:string[];
  policyPreference?:string;
  evidenceId?:string;
  candidates:Array<{
    providerId:UniversalProviderId;
    score:number;
    reasons:string[];
  }>;
};

export type ProviderExecutionRequest={
  prompt:string;
  system?:string;
  model?:string;
  tools?:import("./normalized").NormalizedTool[];
  responseSchema?:Record<string,unknown>;
  route?:ProviderRouteRequest;
};

export type ProviderExecutionResult={
  ok:boolean;
  providerId:UniversalProviderId|null;
  sessionId:string|null;
  output:unknown;
  attempts:Array<{
    providerId:UniversalProviderId;
    ok:boolean;
    error:string|null;
  }>;
};
