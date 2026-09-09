import type {NormalizedProviderOutput,NormalizedUsage} from "./normalized";

export const emptyUsage=():NormalizedUsage=>({
  inputTokens:null,outputTokens:null,totalTokens:null,reasoningTokens:null,costUsd:null
});

export function outputToStreamChunks(output:NormalizedProviderOutput){
  return {
    text:output.text||"",
    toolCalls:Array.isArray(output.toolCalls)?output.toolCalls:[],
    usage:output.usage||emptyUsage(),
    finishReason:output.finishReason||null
  };
}
