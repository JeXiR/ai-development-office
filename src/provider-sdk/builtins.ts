import {BUILTIN_PROVIDER_MANIFESTS} from "./manifests";
import {CliProviderAdapter} from "./adapters/cli";
import {OllamaAdapter} from "./adapters/ollama";
import {OpenAICompatibleAdapter} from "./adapters/openai-compatible";
import {AnthropicAdapter} from "./adapters/anthropic";
import {GeminiAdapter} from "./adapters/gemini";
import {XAIAdapter} from "./adapters/xai";
import type {UniversalProviderAdapter,UniversalProviderId} from "./types";

const byId=(id:UniversalProviderId)=>{
  const m=BUILTIN_PROVIDER_MANIFESTS.find(x=>x.id===id);
  if(!m)throw new Error(`Missing provider manifest: ${id}`);
  return m;
};

export function createBuiltinAdapters():UniversalProviderAdapter[]{
  return [
    new OpenAICompatibleAdapter({...byId("openai"),endpointEnv:"OPENAI_BASE_URL"},{defaultBaseUrl:"https://api.openai.com/v1",modelEnv:"OPENAI_MODEL"}),
    new AnthropicAdapter(byId("anthropic")),
    new GeminiAdapter(byId("gemini")),
    new XAIAdapter(byId("xai")),
    new OpenAICompatibleAdapter({...byId("groq"),endpointEnv:"GROQ_BASE_URL"},{defaultBaseUrl:"https://api.groq.com/openai/v1",modelEnv:"GROQ_MODEL"}),
    new CliProviderAdapter(byId("cursor"),"agent",prompt=>["-p","--output-format","text",prompt]),
    new CliProviderAdapter(byId("opencode"),"opencode",prompt=>["run",prompt]),
    new OllamaAdapter(byId("ollama")),
    new OpenAICompatibleAdapter(byId("openai-compatible"),{modelEnv:"OPENAI_COMPATIBLE_MODEL"})
  ];
}
