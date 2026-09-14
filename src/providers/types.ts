export type ProviderId=
  |"cursor"
  |"claude"
  |"codex"
  |"gemini"
  |"copilot"
  |"kimi"
  |"qwen"
  |"crush"
  |"pi"
  |"grok"
  |"opencode"
  |"custom"
  |"local";

export type ProviderHealthStatus="unknown"|"healthy"|"degraded"|"unavailable";

export type ProviderHealth={
  provider:ProviderId;
  status:ProviderHealthStatus;
  checkedAt:string;
  latencyMs:number|null;
  executable:string|null;
  message:string;
};

export type ProviderCapabilities={
  coding:boolean;
  planning:boolean;
  review:boolean;
  security:boolean;
  testing:boolean;
  local:boolean;
  resume:boolean;
  streaming:boolean;
};

export type ProviderCostProfile={
  inputCostWeight:number;
  outputCostWeight:number;
  relativeCost:number;
};

export type ProviderDefinition={
  id:ProviderId;
  displayName:string;
  executableCandidates:string[];
  capabilities:ProviderCapabilities;
  cost:ProviderCostProfile;
  defaultArgs:string[];
};

export type ProviderRouteInput={
  task:string;
  role?:string|null;
  preferred?:ProviderId|null;
  excluded?:ProviderId[];
  localOnly?:boolean;
};

export type ProviderRouteDecision={
  selected:ProviderId|null;
  ranked:Array<{
    provider:ProviderId;
    score:number;
    reasons:string[];
    health:ProviderHealthStatus;
  }>;
  reason:string;
};

export type ProviderSessionDescriptor={
  provider:ProviderId;
  executable:string;
  args:string[];
  cwd:string;
  resumeToken:string|null;
};
