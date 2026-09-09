export type NormalizedTool={
  name:string;
  description?:string;
  inputSchema:Record<string,unknown>;
};

export type NormalizedToolCall={
  id:string;
  name:string;
  arguments:unknown;
};

export type NormalizedUsage={
  inputTokens:number|null;
  outputTokens:number|null;
  totalTokens:number|null;
  reasoningTokens:number|null;
  costUsd:number|null;
};

export type NormalizedProviderOutput={
  text:string;
  toolCalls:NormalizedToolCall[];
  structured:unknown|null;
  finishReason:string|null;
  usage:NormalizedUsage;
  raw:unknown;
};

export type NativeTaskInput={
  prompt:string;
  system?:string;
  model?:string;
  tools?:NormalizedTool[];
  responseSchema?:Record<string,unknown>;
};
