export type UniversalProviderId=
  |"openai"
  |"anthropic"
  |"gemini"
  |"xai"
  |"groq"
  |"cursor"
  |"opencode"
  |"ollama"
  |"openai-compatible";

export type ProviderCapabilities={
  coding:boolean;
  reasoning:boolean;
  toolCalling:boolean;
  structuredOutput:boolean;
  vision:boolean;
  streaming:boolean;
  sessionResume:boolean;
  local:boolean;
};

export type ProviderManifest={
  id:UniversalProviderId;
  name:string;
  transport:"native-api"|"openai-compatible"|"cli"|"local-http";
  capabilities:ProviderCapabilities;
  credentialEnv?:string;
  endpointEnv?:string;
};

export type ProviderHealth={
  providerId:UniversalProviderId;
  available:boolean;
  latencyMs:number|null;
  checkedAt:string;
  detail:string|null;
};

export interface UniversalProviderAdapter{
  manifest:ProviderManifest;
  detect():Promise<boolean>;
  health():Promise<ProviderHealth>;
  models():Promise<string[]>;
  createSession(input:{model?:string;system?:string}):Promise<{id:string}>;
  resumeSession(sessionId:string):Promise<{id:string}>;
  sendTask(sessionId:string,input:{prompt:string;system?:string;model?:string;tools?:unknown[];responseSchema?:Record<string,unknown>}):Promise<unknown>;
  streamTask?(sessionId:string,input:{prompt:string;system?:string;model?:string;tools?:unknown[];responseSchema?:Record<string,unknown>},ctx:{signal:AbortSignal;emit:(event:any)=>void;streamId:string}):Promise<unknown>;
  cancel(sessionId:string):Promise<void>;
  usage(sessionId:string):Promise<{inputTokens:number|null;outputTokens:number|null;costUsd:number|null}>;
}
